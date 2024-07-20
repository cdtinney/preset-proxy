const puppeteer = require('puppeteer');
const { createServer } = require('node:http');
const basePresetUrl = `https://pvme.io/preset-maker/#/`;

const cachedImages: Record<string, any> = {
  'id': 'imagebuffer'
};

const getPresetAsImage = async (presetId: string) => {
  if (cachedImages[presetId]) {
    console.info(`Using cached image for preset: ${presetId}`);
    return cachedImages[presetId];

  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
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
    res.writeHead(404, {"Content-Type": "text/html"});
    res.write('<h1>Preset not found.</h1>');
    res.end();
    return;
  }

  const image = await getPresetAsImage(presetId);
  
  res.statusCode = 200;
  res.setHeader('Content-Type', `image/jpeg`);
  res.end(image);
});


console.log(`$PORT = ${process.env.PORT}`);
const hostname = '0.0.0.0';
const port = process.env.PORT || 3001;
server.listen(port, hostname, () => {
  console.log(`preset-proxy running at http://${hostname}:${port}/`);
});
