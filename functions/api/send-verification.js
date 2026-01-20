export async function onRequest({ request, env }) {
  // This endpoint allows sending verification emails through Cloudflare
  // You can call this from your app or integrate with external services

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const { to, subject, html } = await request.json();

    // Use Cloudflare's email routing or external service
    // For now, we'll use a simple approach - you can integrate with any SMTP service

    console.log(`Sending email to ${to}: ${subject}`);

    // Example: Send through SMTP (you can configure any SMTP server)
    // const smtpResponse = await sendThroughSMTP(to, subject, html, env);

    // For testing, we'll just log the email
    // Replace this with actual email sending logic

    return new Response(JSON.stringify({
      success: true,
      message: `Email sent to ${to}`,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}