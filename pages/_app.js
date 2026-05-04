import '../styles/globals.css';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>mspaintify — draw like a kid, get a real photo</title>
        <meta name="description" content="Turn your terrible mouse drawings into photorealistic images. Powered by AI." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="mspaintify" />
        <meta property="og:description" content="draw like a kid → get a real photo ✨" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🎨%3C/text%3E%3C/svg%3E" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
