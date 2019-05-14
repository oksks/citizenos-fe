'use strict';

angular
    .module('citizenos')
    .controller('TopicReportFormCtrl', ['$scope', '$log', 'ngDialog', 'TopicReport', function ($scope, $log, ngDialog, TopicReport) {
        $log.debug('TopicReportFormCtrl', $scope.topic);

        $scope.reportTypes = TopicReport.TYPES;

        $scope.form = {
            type: null,
            text: null,
            topicId: $scope.topic.id,
            errors: null
        };

        $scope.doReport = function () {
            var topicReport = new TopicReport();

            topicReport.type = $scope.form.type;
            topicReport.text = $scope.form.text;

            $scope.form.errors = null;

            topicReport
                .$save({topicId: $scope.topic.id})
                .then(
                    function () {
                        ngDialog.closeAll();
                    },
                    function (res) {
                        $scope.form.errors = res.data.errors;
                    }
                );
        };

    }]);
