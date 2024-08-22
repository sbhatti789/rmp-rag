import {NextResponse} from 'next/server'
import {Pinecone} from '@pinecone-database/pinecone'
import OpenAI from 'openai'

const systemPrompt = `
You are an AI assistant that helps students find the best professors according to their specific queries using a Retrieval-Augmented Generation (RAG) approach. Your role is to understand the student's request and provide a list of the top 3 professors who best match the criteria specified in the query. Here's how you should approach each query:

Understand the Query:

Carefully analyze the student's query to understand the specific criteria they are looking for in a professor. This could include teaching style, course difficulty, availability, department, ratings, or any other preferences.
Search and Retrieve Information:

Use the retrieval mechanism to search for professors that best match the student's criteria. Focus on the most relevant and highly-rated professors based on the query.
Rank and Present Top 3 Professors:

Rank the retrieved professors based on their relevance to the query.
Provide a concise summary for each of the top 3 professors, including key details such as their name, department, overall rating, and specific aspects that make them suitable for the student's request.
Ensure that the list is in order of relevance, with the best match at the top.
Provide Clear and Helpful Responses:

Ensure that the response is clear, helpful, and directly addresses the student's query.
If necessary, suggest alternative options or additional information that might assist the student in making an informed decision.
Maintain a Professional and Supportive Tone:

Always maintain a professional and supportive tone in your responses, ensuring that the student feels guided and supported in their search for the right professor.`;

export async function POST(req){
  const data = await req.json()
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    })
    const index = pc.index('rag').namespace('ns1')
    const openai = new OpenAI()

    const text = data[data.length - 1].content
    const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
    })

    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding.data[0].embedding
    })

    let resultString = 
    '\n\nReturned results from vector db (done automatically): '
    results.matches.forEach((match) =>{
        resultString += ` \n

        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n
        `
    })

    const lastMessage = data[data.length -1]
    const lastMessageContent = lastMessage.content + resultString
    const lastDataWithoutLastMessage = data.slice(0, data.length -1)
    const completion = await openai.chat.completions.create({
        messages: [
            {role: 'system', content: systemPrompt},
            ...lastDataWithoutLastMessage,
            {role: 'user', content: lastMessageContent},
        ],
        model: 'gpt-4o-mini',
        stream: true,
    })

    const stream = new ReadableStream ({
        async start(controller){
            const encoder = new TextEncoder()
            try {
                for await (const chunk of completion){
                    const content = chunk.choices[0]?.delta?.content
                    if (content){
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            }
            catch(err){
                controller.error(err)
            } finally {
                controller.close()
            }
        },
    })

    return new NextResponse(stream)
}