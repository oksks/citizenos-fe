angular
    .module('citizenos')
    .service('sTopic', ['$http', '$log', '$q', 'sLocation', function ($http, $log, $q, sLocation) {
        var sTopic = this;

        sTopic.STATUSES = {
            inProgress: 'inProgress', // Being worked on
            voting: 'voting', // Is being voted which means the Topic is locked and cannot be edited.
            followUp: 'followUp', // Done editing Topic and executing on the follow up plan.
            closed: 'closed' // Final status - Topic is completed and no editing/reopening/voting can occur.
        };

        sTopic.CATEGORIES = {
            business: 'business', // Business and industry
            transport: 'transport', // Public transport and road safety
            taxes: 'taxes', // Taxes and budgeting
            agriculture: 'agriculture', // Agriculture
            environment: 'environment', // Environment, animal protection
            culture: 'culture', // Culture, media and sports
            health: 'health', // Health care and social care
            work: 'work', // Work and employment
            education: 'education', // Education
            politics: 'politics', // Politics and public administration
            communities: 'communities', // Communities and urban development
            defense: 'defense', //  Defense and security
            integration: 'integration', // Integration and human rights
            varia: 'varia' // Varia
        };

        sTopic.listUnauth = function (statuses, categories, offset, limit) {
            var path = sLocation.getAbsoluteUrlApi('/api/topics');

            return $http.get(path, {
                params: {
                    statuses: statuses,
                    categories: categories,
                    offset: offset,
                    limit: limit
                }
            });
        };

        sTopic.readUnauth = function (topic) {
            var success = function (res) {
                return res.data.data;
            };

            var error = function (res) {
                return $q.reject(res);
            };

            var path = sLocation.getAbsoluteUrlApi('/api/topics/:topicId', {topicId: topic.id});
            return $http.get(path).then(success, error);
        };

        sTopic.create = function (topic) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/topics');
            return $http.post(path, topic);
        };

    }]);
