import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const OPENAI_API_KEY = process.env.NEXT_OPEN_AI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured on server' },
        { status: 500 }
      );
    }
    const { documentId } = await request.json();
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // fetch the document
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, raw_text, summary')
      .eq('id', documentId)
      .single();
    if (fetchError || !document) {
      console.error('Error fetching document:', fetchError);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // If summary already exists, return it
    if (document.summary && document.summary.trim().length > 0) {
      console.log(` Found existing summary for doc ${documentId}`);
      return NextResponse.json({ summary: document.summary });
    }
    // check if document has text to summarize
    if (!document.raw_text || document.raw_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Document has no text content to summarize' },
        { status: 400 }
      );
    }

    // calls the openai api key
    const truncatedText = document.raw_text.length > 12000
      ? document.raw_text.substring(0, 12000)
      : document.raw_text;

    console.log(`Calling OpenAI for doc ${documentId}`);
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates concise, clear summaries of documents. Provide a summary in 2-3 sentences that captures the main points.',
          },
          {
            role: 'user',
            content: `Please summarize the following document:\n\n${truncatedText}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 300,
      }),
    });
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      );
    }

    const data: OpenAIResponse = await openaiResponse.json();
    const summary = data.choices[0]?.message?.content;
    if (!summary) {
      return NextResponse.json(
        { error: 'No summary generated from OpenAI' },
        { status: 500 }
      );
    }

    // Stores the newlygenerated summary
    const { data: updateData, error: updateError } = await supabase
      .from('documents')
      .update({
        summary: summary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (updateError) {
      console.error(`Error storing summary for doc ${documentId}:`, updateError);
      console.error(`Update error details:`, updateError.message, updateError.code);
    } else {
      console.log(`Successfully stored summary for doc ${documentId}`);
      console.log(`Update response:`, updateData);
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error in summarize API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
