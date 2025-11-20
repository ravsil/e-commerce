const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const seedDir = path.join(__dirname, 'seedContent');
const outputFile = path.join(__dirname, 'seedContent', 'products.json');

// Headers para simular um navegador real e evitar erro 403 da Zara
const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.zara.com/',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Dest': 'image',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'cross-site'
};

function getAllCsvFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function (file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllCsvFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.csv')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

// Função para validar a URL da imagem
async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

    const res = await fetch(url, {
      method: 'GET',
      headers: REQUEST_HEADERS,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

function generateStock(price) {
  let min, max;

  if (price < 100) {
    min = 50; max = 150;
  } else if (price < 300) {
    min = 20; max = 60;
  } else {
    min = 2; max = 15;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

(async () => {
  try {
    const allCsvs = getAllCsvFiles(seedDir);
    console.log(`Encontrados ${allCsvs.length} arquivos CSV.`);

    let allProducts = [];

    for (const file of allCsvs) {
      console.log(`Processando: ${path.basename(file)}...`);

      const content = fs.readFileSync(file, 'utf-8');
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        trim: true
      });

      const batchSize = 10;
      const processedRecords = [];

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        const promises = batch.map(async (r) => {
          const nr = {};
          Object.keys(r || {}).forEach((k) => {
            const nk = String(k).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            nr[nk] = r[k];
          });
          r = nr;

          let priceStr = r.price || r.price || '0';
          let rawPrice = parseFloat(String(priceStr).replace(/[^0-9.]/g, ''));
          if (isNaN(rawPrice)) rawPrice = 0;

          // rupias indianas para real
          let finalPrice = Math.floor((rawPrice / 16.74) * 100) / 100;

          let stockQuantity = generateStock(finalPrice);

          let rawImage = r.product_images || r.product_image || r.images || r.image || '';
          const urls = String(rawImage).match(/https?:\/\/[^\s'\"]+/g) || [];

          const validImages = [];

          for (const url of urls) {
            const isValid = await checkUrl(url);
            if (isValid) {
              validImages.push(url);
            }
          }

          if ((r.product_name || r.productname || r.name || r.product) && validImages.length > 0) {
            return {
              name: r.product_name || r.productname || r.name || r.Product_Name || r.Product || '',
              description: r.details || r.description || r.Description || '',
              price: finalPrice,
              stock: stockQuantity,
              images: validImages
            };
          }
          return null;
        });

        const results = await Promise.all(promises);
        processedRecords.push(...results.filter(p => p !== null));
      }

      console.log(`  └> ${processedRecords.length} produtos válidos processados.`);
      allProducts = allProducts.concat(processedRecords);
    }

    fs.writeFileSync(outputFile, JSON.stringify(allProducts, null, 2));
    console.log(`SUCESSO! products.json gerado com ${allProducts.length} produtos.`);
    return;

  } catch (error) {
    console.error("Erro Fatal:", error);
  }
})();