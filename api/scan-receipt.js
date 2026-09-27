import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not available to the server.",
    });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        error: "No receipt image supplied.",
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    const response = await openai.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Read this shopping receipt.

Today's date is ${today}.

Return ONLY:
- merchant
- total
- date
- suggested_category

The suggested category MUST be one of:

house
food
pets
car
subscriptions
streaming
finance
Kids
other

Rules:
- Use the FINAL amount actually paid.
- Ignore VAT.
- Ignore subtotal.
- Return the receipt date as YYYY-MM-DD.
- Look specifically for the transaction or purchase date printed on the receipt.
- A genuine receipt date should normally be reasonably close to today's date.
- Do not mistake loyalty card numbers, transaction references, receipt numbers, card numbers or other numeric strings for dates.
- Do not change a clearly printed historical receipt date just because it is old.
- If the receipt date cannot be read confidently, return an empty string for date rather than guessing.
`,
            },
            {
              type: "input_image",
              image_url: image,
              detail: "auto",
            },
          ],
        },
      ],

      text: {
        format: {
          type: "json_schema",
          name: "receipt",
          strict: true,
          schema: {
            type: "object",
            properties: {
              merchant: {
                type: "string",
              },
              total: {
                type: "number",
              },
              date: {
                type: "string",
              },
              suggested_category: {
                type: "string",
                enum: [
                  "house",
                  "food",
                  "pets",
                  "car",
                  "subscriptions",
                  "streaming",
                  "finance",
                  "Kids",
                  "other",
                ],
              },
            },
            required: [
              "merchant",
              "total",
              "date",
              "suggested_category",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const receipt = JSON.parse(response.output_text);

    return res.status(200).json(receipt);
  } catch (err) {
    console.error("Receipt scan failed:", err);

    return res.status(500).json({
      error: "Receipt could not be read.",
    });
  }
}