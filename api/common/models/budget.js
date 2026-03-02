module.exports = function(Budget) {
  Budget.observe('before save', function recalculateImports(ctx, next) {
    if (ctx.instance) {
      const normalizedBudget = normalizeBudget(ctx.instance);
      ctx.instance.chapters = normalizedBudget.chapters;
      ctx.instance.totalCostImport = normalizedBudget.totalCostImport;
      ctx.instance.totalSaleImport = normalizedBudget.totalSaleImport;
      return next();
    }

    if (!ctx.data || !Object.prototype.hasOwnProperty.call(ctx.data, 'chapters')) {
      return next();
    }

    const normalizedBudget = normalizeBudget(ctx.data);
    ctx.data.chapters = normalizedBudget.chapters;
    ctx.data.totalCostImport = normalizedBudget.totalCostImport;
    ctx.data.totalSaleImport = normalizedBudget.totalSaleImport;

    return next();
  });
};

function normalizeBudget(rawBudget) {
  const normalizedChapters = normalizeChapters(rawBudget.chapters || []);

  let totalCostImport = 0;
  let totalSaleImport = 0;

  normalizedChapters.forEach(function(chapter) {
    totalCostImport += chapter.totalCostImport;
    totalSaleImport += chapter.totalSaleImport;
  });

  return {
    chapters: normalizedChapters,
    totalCostImport: roundToCents(totalCostImport),
    totalSaleImport: roundToCents(totalSaleImport),
  };
}

function normalizeChapters(rawChapters) {
  return rawChapters.map(function(rawChapter, chapterIndex) {
    const materialSaleCoefficient = toNumber(rawChapter.materialSaleCoefficient, 1);
    const labourSaleCoefficient = toNumber(rawChapter.labourSaleCoefficient, 1);

    const normalizedBatches = (rawChapter.batches || []).map(function(rawBatch, batchIndex) {
      const amount = toNumber(rawBatch.amount, 0);
      const materialCostImport = toNumber(rawBatch.materialCostImport, 0);
      const labourCostImport = toNumber(rawBatch.labourCostImport, 0);

      const unitaryCostImport = roundToCents(materialCostImport + labourCostImport);
      const totalCostImport = roundToCents(unitaryCostImport * amount);
      const unitarySaleCost = roundToCents(
        materialCostImport * materialSaleCoefficient + labourCostImport * labourSaleCoefficient
      );
      const totalSaleImport = roundToCents(unitarySaleCost * amount);

      return {
        rank: toNumber(rawBatch.rank, batchIndex + 1),
        description: rawBatch.description || '',
        amount: amount,
        materialCostImport: materialCostImport,
        labourCostImport: labourCostImport,
        unitaryCostImport: unitaryCostImport,
        totalCostImport: totalCostImport,
        unitarySaleCost: unitarySaleCost,
        totalSaleImport: totalSaleImport,
      };
    });

    let chapterCostImport = 0;
    let chapterSaleImport = 0;

    normalizedBatches.forEach(function(batch) {
      chapterCostImport += batch.totalCostImport;
      chapterSaleImport += batch.totalSaleImport;
    });

    return {
      rank: toNumber(rawChapter.rank, chapterIndex + 1),
      description: rawChapter.description || '',
      materialSaleCoefficient: materialSaleCoefficient,
      labourSaleCoefficient: labourSaleCoefficient,
      totalCostImport: roundToCents(chapterCostImport),
      totalSaleImport: roundToCents(chapterSaleImport),
      batches: normalizedBatches,
    };
  });
}

function toNumber(value, defaultValue) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : defaultValue;
}

function roundToCents(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}