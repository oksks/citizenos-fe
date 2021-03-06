'use strict';

angular
    .module('citizenos')
    .controller('MyCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$q', '$log', 'Group', 'Topic', 'GroupMemberTopic', 'rItems', function ($rootScope, $scope, $state, $stateParams, $q, $log, Group, Topic, GroupMemberTopic, rItems) {
        $log.debug('MyCtrl', $stateParams, rItems);

        $scope.itemList = rItems;

        // All the Topic filters in the dropdown
        var filters = [
            {
                id: 'all',
                name: 'VIEWS.MY.FILTERS.SHOW_ALL_MY_TOPICS',
                onSelect: function () {
                    $state.go('my.topics', {filter: this.id}, {reload: true});
                }
            },
            {
                name: 'VIEWS.MY.FILTERS.SHOW_ONLY',
                children: [
                    {
                        id: 'public',
                        name: 'VIEWS.MY.FILTERS.MY_PUBLIC_TOPICS',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id}, {reload: true});
                        }
                    },
                    {
                        id: 'private',
                        name: 'VIEWS.MY.FILTERS.MY_PRIVATE_TOPICS',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id}, {reload: true});
                        }
                    },
                    {
                        id: 'iCreated',
                        name: 'VIEWS.MY.FILTERS.TOPICS_I_CREATED',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id}, {reload: true});
                        }
                    }
                ]
            },
            {
                id: 'grouped',
                name: 'VIEWS.MY.FILTERS.TOPICS_ORDERED_BY_GROUPS',
                onSelect: function () {
                    $state.go('my.groups', {filter: this.id}, {reload: true});
                }
            }
        ];

        var filterParam = $stateParams.filter || filters[0].id;
        $scope.filters = {
            items: filters,
            selected: _.find(filters, {id: filterParam}) || _.chain(filters).map('children').flatten().find({id: filterParam}).value() || filters[0]
        };

        $scope.$watch(
            function () {
                return $scope.itemList;
            },
            function (newList) {
                if (!newList || !newList.length) return;
                // Navigate to first item in the list on big screens.
                if ($rootScope.wWidth > 750) {
                    if ($state.is('my.groups') || $state.is('my.topics')) {
                        var item = $scope.itemList[0];
                        if ($scope.isGroup(item)) {
                            $state.go('my.groups.groupId', {groupId: item.id, filter: 'grouped'});
                        } else {
                            $state.go('my.topics.topicId', {topicId: item.id});
                        }
                    }
                }
            }
        );

        $scope.isGroup = function (object) {
            return object instanceof Group;
        };

        var groupMemberTopicsVisible = []; // goupId-s of which GroupMemberTopic list is expanded

        $scope.isGroupMemberTopicsVisible = function (group) {
            return groupMemberTopicsVisible.indexOf(group.id) > -1;
        };

        $scope.doToggleGroupTopicList = function (group) {
            var indexGroupIdVisible = groupMemberTopicsVisible.indexOf(group.id);

            if (indexGroupIdVisible < 0) { // not visible
                GroupMemberTopic
                    .query({groupId: group.id}).$promise
                    .then(function (topics) {
                        group.members.topics.rows = topics;
                        group.members.topics.count = topics.length;
                        groupMemberTopicsVisible.push(group.id);
                    });
            } else { // already visible, we hide
                groupMemberTopicsVisible.splice(indexGroupIdVisible, 1);
            }
        };

    }]);
