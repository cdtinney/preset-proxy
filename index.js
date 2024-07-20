"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const puppeteer = require('puppeteer');
const { createServer } = require('node:http');
const hostname = '127.0.0.1';
const port = process.env.PORT || 3001;
const basePresetUrl = `https://pvme.io/preset-maker/#/`;
const cachedImages = {
    'id': 'imagebuffer'
};
const getPresetAsImage = (presetId) => __awaiter(void 0, void 0, void 0, function* () {
    if (cachedImages[presetId]) {
        console.info(`Using cached image for preset: ${presetId}`);
        return cachedImages[presetId];
    }
    const browser = yield puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = yield browser.newPage();
    page.setViewport({ width: 1200, height: 700 });
    const presetUrl = `${basePresetUrl}${presetId}`;
    yield page.goto(presetUrl);
    // Wait for API requests to finish
    yield page.waitForNetworkIdle();
    try {
        const presetSelector = '.preset-editor__export-container';
        const presetDom = yield page.$(presetSelector);
        if (!presetDom) {
            return;
        }
        const imageBuffer = yield presetDom.screenshot({ omitBackground: true });
        // test without caching
        // cachedImages[presetId] = imageBuffer;
        return imageBuffer;
    }
    finally {
        yield page.close();
        yield browser.close();
    }
});
const server = createServer((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.info(`Proxy request: ${req.url}`);
    const url = new URL(`http://${(_a = process.env.HOST) !== null && _a !== void 0 ? _a : 'localhost'}${req.url}`);
    const presetId = url.searchParams.get('id');
    // Ignore all other requests
    if (!presetId) {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.write('<h1>Preset not found.</h1>');
        res.end();
        return;
    }
    const image = yield getPresetAsImage(presetId);
    res.statusCode = 200;
    res.setHeader('Content-Type', `image/jpeg`);
    res.end(image);
}));
server.listen(port, hostname, () => {
    console.log(`preset-proxy running at http://${hostname}:${port}/`);
});
