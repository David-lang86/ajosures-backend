import { serve } from "std/http/server"

serve(async (req: Request) => {

  try {

    const body =
      await req.json()

    const reference =
      body.reference

    const secretKey =
      Deno.env.get(
        'FLUTTERWAVE_SECRET_KEY'
      )

    const response =
      await fetch(
        `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`,
        {
          headers: {
            Authorization:
              `Bearer ${secretKey}`,
          },
        }
      )

    const result =
      await response.json()

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          'Content-Type':
            'application/json',
        },
      }
    )

  } catch (error: unknown) {

    let message =
      'Unknown error'

    if (
      error instanceof Error
    ) {

      message =
        error.message

    }

    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 500,
      }
    )

  }

})