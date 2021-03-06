'use strict';

angular
    .module('citizenos')
    .controller('TopicVoteCreateCtrl', ['$scope', '$state', '$log', 'Vote', function ($scope, $state, $log, Vote) {
        $log.debug('TopicVoteCreateCtrl');

        $scope.$parent.$parent.datePickerMin = new Date();
        $scope.$parent.$parent.voteTypes = Vote.VOTE_TYPES;
        $scope.$parent.$parent.voteAuthTypes = Vote.VOTE_AUTH_TYPES;

        var CONF = {
            defaultOptions: {
                regular: [
                    {value: 'Yes', enabled: true},
                    {value: 'No', enabled: true}
                ],
                multiple: [
                    {value: null},
                    {value: null},
                    {value: null}
                ]
            },
            extraOptions: {
                neutral: {value: 'Neutral', enabled: false}, // enabled - is the option enabled by default
                veto: {value: 'Veto', enabled: false}
            },
            optionsMax: 10,
            optionsMin: 2
        };

        $scope.showVoteCreate();

        $scope.$parent.$parent.voteForm = {
            options: [],
            extraOptions: angular.copy(CONF.extraOptions),
            delegationIsAllowed: false,
            endsAt: null,
            voteType: null,
            authType: $scope.voteAuthTypes.soft,
            numberOfDaysLeft: 0
        };

        $scope.$parent.$parent.setVoteType = function (voteType) {
            if (voteType == $scope.voteTypes.multiple) {
                $scope.voteForm.voteType = voteType;
                $scope.voteForm.options = angular.copy(CONF.defaultOptions.multiple);
            } else {
                $scope.voteForm.voteType = $scope.voteTypes.regular;
                $scope.voteForm.options = angular.copy(CONF.defaultOptions.regular);
            }
        };

        $scope.$parent.$parent.removeOption = function (key) {
            $scope.voteForm.options.splice(key, 1);
        };

        $scope.$parent.$parent.addOption = function () {
            $scope.voteForm.options.push({value: null});
        };

        $scope.$parent.$parent.daysToVoteEnd = function () {
            if ($scope.voteForm.endsAt) {
                if ($scope.voteForm.endsAt === true) {
                    $scope.voteForm.endsAt = new Date();
                }
                var endDate = $scope.voteForm.endsAt;
                var diffTime = new Date(endDate).getTime() - new Date().getTime();
                $scope.voteForm.numberOfDaysLeft = Math.ceil(diffTime / (1000 * 3600 * 24)); // Diff in days
            }
            return $scope.voteForm.numberOfDaysLeft;
        };

        $scope.$parent.$parent.createVote = function () {
            var vote = new Vote({topicId: $scope.topic.id});
            vote.options = angular.copy($scope.voteForm.options);
            vote.delegationIsAllowed = $scope.voteForm.delegationIsAllowed;
            vote.type = $scope.voteForm.voteType;
            vote.authType = $scope.voteForm.authType;

            for (var o in $scope.voteForm.extraOptions) {
                var option = $scope.voteForm.extraOptions[o];
                if (option.enabled) {
                    vote.options.push({value: option.value});
                }
            }
            vote.options = _.filter(vote.options, function (option) {
                return !!option.value
            });
            // Ends at midnight of the date chosen, thus 00:00:00 of the next day.
            var endsAt = moment($scope.voteForm.endsAt).add(1, 'd').toDate();

            if (endsAt) {
                vote.endsAt = endsAt;
            }

            vote.$save(function (vote, putResponseHeaders) {
                $state.go('topics.view.votes.view', {topicId: $scope.topic.id, voteId: vote.id}, {reload: true});
            });
        };
    }]);
