export default function BudgetApiService($http) {
  const endpoint = '/api/Budgets';

  this.list = function() {
    return $http.get(endpoint).then(extractData);
  };

  this.getById = function(budgetId) {
    return $http.get(`${endpoint}/${budgetId}`).then(extractData);
  };

  this.create = function(budgetPayload) {
    return $http.post(endpoint, budgetPayload).then(extractData);
  };

  this.update = function(budgetId, budgetPayload) {
    return $http.put(`${endpoint}/${budgetId}`, budgetPayload).then(extractData);
  };

  this.remove = function(budgetId) {
    return $http.delete(`${endpoint}/${budgetId}`).then(extractData);
  };
}

BudgetApiService.$inject = ['$http'];

function extractData(response) {
  return response.data;
}