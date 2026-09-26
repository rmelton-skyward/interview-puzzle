import OpenAI from 'openai';
import { AiServiceError, ValidationError } from '../errors.js';
import { SeatAssistantPreferencesSchema } from '../schemas/venue.js';
import { getBestSeats } from './venueService.js';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function findSeatsFromNaturalLanguage(venueId: string, prompt: string) {
  if (!openai) {
    throw new AiServiceError('Set OPENAI_API_KEY to use the AI seat assistant');
  }

  let response;
  try {
    response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'Extract the requested party size for a venue seat search. Return only JSON in the form {"partySize": number}. Infer a positive whole number from the user request. If no party size is present, return {"partySize": 1}. Do not include any other fields.',
        },
        { role: 'user', content: prompt },
      ],
    });
  } catch {
    throw new AiServiceError('The AI provider could not process the seat request');
  }

  const content = response.choices[0]?.message.content;
  if (!content) {
    throw new AiServiceError('The AI provider returned an empty response');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AiServiceError('The AI provider returned an invalid response');
  }

  const preferences = SeatAssistantPreferencesSchema.safeParse(parsed);
  if (!preferences.success) {
    throw new ValidationError('The AI response did not contain a valid party size');
  }

  const recommendation = await getBestSeats(venueId, preferences.data.partySize);
  return { prompt, preferences: preferences.data, ...recommendation };
}