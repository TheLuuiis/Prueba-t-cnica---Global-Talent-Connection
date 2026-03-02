module.exports = function(app) {
  const Budget = app.models.Budget;

  Budget.count(function(error, totalBudgets) {
    if (error || totalBudgets > 0) return;

    Budget.create({
      name: 'Presupuesto Demo',
      thumbnail: '',
      date: new Date(),
      clientName: 'Cliente Ejemplo',
      chapters: [
        {
          rank: 1,
          description: 'Capítulo 1',
          materialSaleCoefficient: 1.3,
          labourSaleCoefficient: 1.2,
          batches: [
            {
              rank: 1,
              description: 'Lote 1',
              amount: 2,
              materialCostImport: 120,
              labourCostImport: 60,
            },
            {
              rank: 2,
              description: 'Lote 2',
              amount: 1,
              materialCostImport: 300,
              labourCostImport: 90,
            },
          ],
        },
      ],
    }, function() {});
  });
};