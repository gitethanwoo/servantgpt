declare global {
  interface HTMLVideoElement {
    captureStream(): MediaStream;
  }
}

export async function extractAudioFromVideo(videoFile: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    console.log('Starting video processing:', videoFile.type, videoFile.size);
    const video = document.createElement('video');
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    
    // Try WAV first, then fall back to other formats
    const supportedMimeTypes = [
      'audio/wav',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus'
    ].filter(type => MediaRecorder.isTypeSupported(type));

    console.log('Supported MIME types:', supportedMimeTypes);

    if (supportedMimeTypes.length === 0) {
      reject(new Error('No supported audio formats available'));
      return;
    }

    video.src = URL.createObjectURL(videoFile);
    video.load();

    video.onloadedmetadata = async () => {
      console.log('Video metadata loaded. Duration:', video.duration);
      try {
        const source = audioContext.createMediaElementSource(video);
        source.connect(destination);
        source.connect(audioContext.destination);

        console.log('Audio context and connections created');
        
        // Force the MIME type extension to match the expected format
        const mimeType = supportedMimeTypes[0];
        const fileExtension = mimeType.split('/')[1].split(';')[0];
        console.log('Using MIME type:', mimeType, 'with extension:', fileExtension);
        
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: mimeType
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          console.log('Received data chunk:', e.data.size, 'bytes');
          chunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
          console.log('MediaRecorder stopped');
          URL.revokeObjectURL(video.src);
          // Create blob with explicit type that matches expected formats
          const finalBlob = new Blob(chunks, { type: `audio/${fileExtension}` });
          console.log('Final audio blob created:', finalBlob.size, 'bytes', finalBlob.type);
          resolve(finalBlob);
          audioContext.close();
        };

        video.currentTime = 0;
        await video.play();
        console.log('Video playback started');
        mediaRecorder.start(1000);
        
        video.onended = () => {
          console.log('Video playback ended');
          mediaRecorder.stop();
        };
        
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            console.log('Stopping MediaRecorder via timeout');
            mediaRecorder.stop();
          }
        }, (video.duration * 1000) + 1000);
      } catch (error) {
        console.error('Error during audio extraction:', error);
        reject(error);
      }
    };

    video.onerror = (e) => {
      console.error('Video loading error:', e);
      reject(new Error('Failed to load video'));
    };
  });
}

export async function splitAudioFile(file: Blob, maxSizeMB = 25): Promise<Blob[]> {
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return [file];
  }

  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const chunks: Blob[] = [];
  const durationPerChunk = 10 * 60; // 10 minutes per chunk
  const totalDuration = audioBuffer.duration;
  
  for (let start = 0; start < totalDuration; start += durationPerChunk) {
    const end = Math.min(start + durationPerChunk, totalDuration);
    
    // Create a new buffer for this chunk
    const chunkDuration = end - start;
    const chunkBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      chunkDuration * audioBuffer.sampleRate,
      audioBuffer.sampleRate
    );
    
    // Copy the audio data for this chunk
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const chunkData = chunkBuffer.getChannelData(channel);
      const startSample = Math.floor(start * audioBuffer.sampleRate);
      const endSample = Math.floor(end * audioBuffer.sampleRate);
      chunkData.set(channelData.subarray(startSample, endSample));
    }
    
    // Convert chunk to MP3 blob
    const mediaStream = audioContext.createMediaStreamDestination();
    const source = audioContext.createBufferSource();
    source.buffer = chunkBuffer;
    source.connect(mediaStream);
    
    // Check for supported MIME types
    const supportedMimeTypes = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mpeg', // MP3
      'audio/wav'
    ].filter(type => MediaRecorder.isTypeSupported(type));

    if (supportedMimeTypes.length === 0) {
      throw new Error('No supported audio formats available');
    }

    const mediaRecorder = new MediaRecorder(mediaStream.stream, {
      mimeType: supportedMimeTypes[0],
      audioBitsPerSecond: 128000
    });
    
    const chunkBlob = await new Promise<Blob>((resolve) => {
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => resolve(new Blob(chunks, { type: supportedMimeTypes[0] }));
      
      mediaRecorder.start();
      source.start();
      setTimeout(() => mediaRecorder.stop(), chunkDuration * 1000);
    });
    
    chunks.push(chunkBlob);
  }
  
  return chunks;
}
