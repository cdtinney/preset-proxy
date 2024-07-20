const puppeteer = require('puppeteer');
const { createServer } = require('node:http');

const hostname = '127.0.0.1';
const port = 3000;

const basePresetUrl = `https://pvme.io/preset-maker/#/`;

const cachedImages: Record<string, any> = {};

const getPresetAsImage = async (presetId: string) => {
  if (cachedImages[presetId]) {
    console.info(`Using cached image for preset: ${presetId}`);
    return cachedImages[presetId];

  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.setViewport({ width: 1200, height: 700 });

  const presetUrl = `${basePresetUrl}${presetId}`;
  await page.goto(presetUrl);

  // Wait for API requests to finish
  await page.waitForNetworkIdle();

  try {
    const presetSelector = '.preset-editor__export-container';
    const presetDom = await page.$(presetSelector);
    if (!presetDom) {
      return;
    }

    const imageBuffer = await presetDom.screenshot({ omitBackground: true });
    // test without caching
    // cachedImages[presetId] = imageBuffer;
    return imageBuffer;
  } finally {
    await page.close();
    await browser.close();
  }
};

const server = createServer(async (req: any, res: any) => {
  console.info(`Proxy request: ${req.url}`);

  const url = new URL(`http://${process.env.HOST ?? 'localhost'}${req.url}`); 
  const presetId = url.searchParams.get('id');
  // Ignore all other requests
  if (!presetId) {
    return;
  }

  const image = await getPresetAsImage(presetId);
  
  res.statusCode = 200;
  res.setHeader('Content-Type', `image/jpeg`);
  res.end(image);
});

server.listen(port, hostname, () => {
  console.log(`preset-proxy running at http://${hostname}:${port}/`);
});
