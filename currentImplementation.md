We're working on a flexible, AI powered data table that users can upload a CSV or Excel file to.

The table will have the following features:
- Add/remove columns
- Add/remove rows
- Sort by column

We will be able to add an empty column, but then define an AI formula for the column. For instance, perhaps the header is 'Sentiment' and the formula is 'What is the sentiment of the text in column B?'. We need to be able to reference columns using a simple lookup key.  We can use openai gpt-4o-mini and the vercel ai sdk. When we define the formula, we need two separate interfaces:
it should run in the cell, but then we need a way to run it on the entire column. 

Lastly, the interface should be simple, intuitive, and the column run should execute the ai api calls in parallel. 