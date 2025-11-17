const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const seedDir = path.join(__dirname, 'seedContent');
const outputFile = path.join(__dirname, 'seedContent', 'products.json');

// Headers para simular um navegador real
const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.zara.com/', // <--- O MAIS IMPORTANTE: Finge que estamos no site deles
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

// Função isolada para validar URL com timeout e headers
async function checkUrl(url) {
  try {
    // AbortController para cancelar se demorar mais de 5 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: 'GET', // Zara as vezes bloqueia HEAD, GET é mais garantido
      headers: REQUEST_HEADERS,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

(async () => {
  try {
    const allCsvs = getAllCsvFiles(seedDir);
    console.log(`📂 Encontrados ${allCsvs.length} arquivos CSV.`);

    let allProducts = [];

    // Processa arquivo por arquivo sequencialmente para não travar a memória
    for (const file of allCsvs) {
      console.log(`Processando: ${path.basename(file)}...`);

      const content = fs.readFileSync(file, 'utf-8');
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        trim: true
      });

      // Lote de processamento (Batch) para não fazer 10 mil requests de uma vez e tomar ban
      const batchSize = 10;
      const processedRecords = [];

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        // Processa o lote em paralelo
        const promises = batch.map(async (r) => {
          let priceStr = r.price || r.Price || '0';
          let rawPrice = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
          if (isNaN(rawPrice)) rawPrice = 0;
          let finalPrice = Math.floor((rawPrice / 16.74) * 100) / 100;

          let rawImage = r.product_images || r.images || '';
          const urls = rawImage.match(/https?:\/\/[^\s'"]+/g) || [];

          const validImages = [];

          for (const url of urls) {
            const isValid = await checkUrl(url);
            if (isValid) {
              validImages.push(url);
              // Se achou pelo menos uma valida, já serve (opcional: break se quiser só 1)
            }
          }

          if (r.product_name && validImages.length > 0) {
            return {
              name: r.product_name || r.name || r.Name,
              description: r.details || r.description || r.Description || '',
              price: finalPrice,
              images: validImages
            };
          }
          return null;
        });

        const results = await Promise.all(promises);
        processedRecords.push(...results.filter(p => p !== null));
      }

      allProducts = allProducts.concat(processedRecords);
    }

    fs.writeFileSync(outputFile, JSON.stringify(allProducts, null, 2));
    console.log(`✅ SUCESSO! products.json gerado com ${allProducts.length} produtos.`);

  } catch (error) {
    console.error("Erro Fatal:", error);
  }
})();