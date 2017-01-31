'use strict';

(function () {

    var module = angular.module('citizenos', ['ui.router', 'pascalprecht.translate', 'ngSanitize', 'ngResource', 'ngTouch', 'ngDialog', 'angularMoment', 'focus-if', 'angular-loading-bar', 'ngCookies', 'angularHwcrypto', 'typeahead']);

    module
        .constant('cosConfig', {
            api: {
                baseUrl: 'https://citizenos-citizenos-web-test.herokuapp.com' // FIXME: Environment based!
            },
            language: {
                default: 'en',
                list: {
                    en: 'English',
                    et: 'Eesti',
                    ru: 'Pусский'
                },
                debug: 'dbg'
            }
        });

    module
        .config(['$stateProvider', '$urlRouterProvider', '$translateProvider', '$locationProvider', '$httpProvider', '$resourceProvider', 'ngDialogProvider', 'cfpLoadingBarProvider', 'cosConfig', function ($stateProvider, $urlRouterProvider, $translateProvider, $locationProvider, $httpProvider, $resourceProvider, ngDialogProvider, cfpLoadingBarProvider, cosConfig) {

            var langReg = Object.keys(cosConfig.language.list).join('|');

            $locationProvider.html5Mode({
                enabled: true,
                rewriteLinks: true,
                requireBase: true
            });

            // Send cookies with API request
            $httpProvider.defaults.withCredentials = true;

            // This is to enable resolving link to state later
            $stateProvider.decorator('parent', function (internalStateObj, parentFn) {
                // This fn is called by StateBuilder each time a state is registered
                // The first arg is the internal state. Capture it and add an accessor to public state object.
                internalStateObj.self.$$state = function () {
                    return internalStateObj;
                };
                // pass through to default .parent() function
                return parentFn(internalStateObj);
            });

            $urlRouterProvider.otherwise(function ($injector, $location) {
                var sAuth = $injector.get('sAuth');
                var $state = $injector.get('$state');
                var $translate = $injector.get('$translate');
                var $log = $injector.get('$log');
                var $cookies = $injector.get('$cookies');

                var locationUrl = $location.url();
                var locationPath = locationUrl.split('/');

                var langkeys = Object.keys(cosConfig.language.list);
                var clientLang = $translate.resolveClientLocale();
                var useLang = cosConfig.language.default;
                if (langkeys.indexOf(clientLang) > -1) {
                    useLang = clientLang;
                }
                if (langkeys.indexOf($cookies.get('language')) > -1) {
                    $log.debug('cookieLang', $cookies.get('language'));
                    useLang = $cookies.get('language');
                }
                $log.debug('$urlRouterProvider.otherwise', 'Language detected before status', useLang);

                var returnLink = '/';

                sAuth
                    .status()
                    .then(function (user) {
                        $log.debug('sAuth.success', user);
                        $log.debug('$urlRouterProvider.otherwise', 'status loaded', user);

                        if (user.language) {
                            useLang = user.language;
                        }
                        resolveOtherwise();
                    }, function (err) {
                        $log.debug('sAuth.err', err);
                        resolveOtherwise();
                    });

                function resolveOtherwise() {
                    console.log('resolveOtherwise', useLang);
                    returnLink = '/' + useLang + '/';
                    if (langkeys.indexOf(locationPath[1]) > -1) {
                        returnLink = '/' + locationPath[1] + '/';
                        useLang = locationPath[1];
                    } else if (locationPath.length > 1) {
                        returnLink = '/' + useLang + locationUrl;
                    }

                    var statesList = $state.get();
                    var stateNext = null;

                    // Try to resolve the link to a state. We don't wanna use $location.href as it would reload the whole page, call all the API-s again.
                    // https://github.com/angular-ui/ui-router/issues/1651
                    for (var i = 0; i < statesList.length; i++) {
                        var stateObj = statesList[i];
                        if (stateObj.name) {
                            var privatePortion = stateObj.$$state();
                            var params = privatePortion.url.exec(returnLink, $location.search());
                            if (params) {
                                stateNext = {
                                    name: stateObj.name,
                                    params: params
                                };
                                $log.debug('$urlRouterProvider.otherwise', 'Matched state', stateNext);
                                break; // Stop the loop, we found our state
                            }
                        }
                    }

                    if (stateNext) {
                        $state.go(stateNext.name, stateNext.params);
                    } else {
                        $state.go('home', {language: useLang});
                    }
                }
            });

            $stateProvider
                .state('main', {
                    url: '/{language:' + langReg + '}',
                    abstract: true,
                    templateUrl: '/views/layouts/main.html',
                    resolve: {
                        /* @ngInject */
                        sTranslateResolve: function ($stateParams, $log, sTranslate, sAuth) {
                            sTranslate.setLanguage($stateParams.language);
                            console.log($stateParams.language);
                            if (sAuth.user.isLoading === false) {
                                $log.debug('$stateProvider.state("main").resolve', 'Status already loaded');
                                return;
                            } else {
                                return sAuth
                                    .status()
                                    .catch(function () {
                                        //This to prevent view from loading before there is a response from sAuth
                                    });
                            }
                        }
                    }
                })
                .state('home', {
                    url: '/',
                    parent: 'main',
                    templateUrl: '/views/home.html'
                })
                .state('account', {
                    url: '/account',
                    abstract: true,
                    parent: 'main',
                    templateUrl: '/views/home.html'
                })
                .state('account.signup', {
                    url: '/signup?email&name&redirectSuccess',
                    controller: ['$scope', '$stateParams', '$log', 'ngDialog', function ($scope, $stateParams, $log, ngDialog) {
                        ngDialog.open({
                            template: '/views/modals/sign_up.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                    }]
                })
                .state('account.login', {
                    url: '/login?email&redirectSuccess',
                    controller: ['$scope', '$stateParams', '$log', 'ngDialog', function ($scope, $stateParams, $log, ngDialog) {
                        ngDialog.open({
                            template: '/views/modals/login.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                    }]
                })
                .state('account.profile', { // TODO: Naming inconsistency but /account/myaccount would be funny. Maybe rename all related files to profile?
                    url: '/profile',
                    controller: ['$scope', '$stateParams', '$log', 'ngDialog', function ($scope, $stateParams, $log, ngDialog) {
                        ngDialog.open({
                            template: '/views/modals/my_account.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                    }]
                })
                .state('account.passwordForgot', {
                    url: '/password/forgot',
                    controller: ['$scope', '$stateParams', '$log', 'ngDialog', function ($scope, $stateParams, $log, ngDialog) {
                        ngDialog.open({
                            template: '/views/modals/password_forgot.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                    }]
                })
                .state('account.passwordReset', {
                    url: '/password/reset/:passwordResetCode?email',
                    controller: ['$scope', '$stateParams', '$log', 'ngDialog', function ($scope, $stateParams, $log, ngDialog) {
                        ngDialog.open({
                            template: '/views/modals/password_reset.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                    }]
                })
                .state('topics', {
                    url: '/topics',
                    abstract: true,
                    parent: 'main',
                    templateUrl: '/views/topics.html'
                })
                .state('topics.create', {
                    url: '/create',
                    parent: 'topics'
                })
                .state('topics.view', {
                    url: '/:topicId',
                    parent: 'topics'
                })
                .state('mytopics', { // MyTopics aka Dashboard
                    url: '/mytopics',
                    parent: 'main',
                    templateUrl: '/views/mytopics.html'
                })
                .state('mytopics.view', { // MyTopics aka Dashboard
                    url: '/:topicId',
                    parent: 'mytopics',
                    templateUrl: '/views/mytopics_view.html'
                })
                .state('my', {
                    url: '/my?filter',
                    parent: 'main',
                    templateUrl: '/views/my.html'
                })
                .state('my.topics', {
                    url: '/topics',
                    parent: 'my',
                    template: '<div ui-view></div>'
                })
                .state('my.topics.topicId', {
                    url: '/:topicId',
                    parent: 'my.topics',
                    templateUrl: '/views/my_topics_topicId.html'
                })
                .state('my.groups', {
                    url: '/groups',
                    parent: 'my',
                    template: '<div ui-view></div>'
                })
                .state('my.groups.groupId', {
                    url: '/:groupId',
                    parent: 'my.groups',
                    templateUrl: '/views/my_groups_groupId.html'
                })
                .state('my.groups.groupId.settings', {
                    url: '/settings',
                    parent: 'my.groups.groupId',
                    controller: ['$scope', '$state', '$stateParams', 'ngDialog', function ($scope, $state, $stateParams, ngDialog) {
                        var dialog = ngDialog.open({
                            template: '/views/modals/group_create_settings.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                        dialog.closePromise.then(function () {
                            $state.go('^');
                        });
                    }]
                })
                .state('groups', {
                    url: '/groups',
                    parent: 'main',
                    templateUrl: '/views/groups.html'
                })
                .state('groups.create', {
                    url: '/create',
                    parent: 'groups',
                    controller: ['$scope', '$stateParams', 'ngDialog', function ($scope, $stateParams, ngDialog) {
                        ngDialog.open({
                            template: '/views/modals/group_create.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                    }]
                })
                .state('about', {
                    url: '/about',
                    parent: 'main',
                    templateUrl: '/views/about.html'
                })
                .state('faq', {
                    url: '/faq',
                    parent: 'main',
                    templateUrl: '/views/faq.html'
                })
                .state('help', {
                    url: '/help',
                    parent: 'main',
                    templateUrl: '/views/help.html'
                })
                .state('inputTest', {
                    url: '/inputtest',
                    controller: ['$scope', '$stateParams', '$log', 'ngDialog', function ($scope, $stateParams, $log, ngDialog) {
                        ngDialog.open({
                            template: '/views/modals/input_test.html',
                            data: $stateParams,
                            scope: $scope // Pass on $scope so that I can access AppCtrl
                        });
                    }]
                });


            $translateProvider.useStaticFilesLoader({
                prefix: 'languages/',
                suffix: '.json'
            });

            // https://github.com/likeastore/ngDialog
            ngDialogProvider.setDefaults({
                overlay: false,
                showClose: false,
                trapFocus: false,
                disableAnimation: true,
                closeByNavigation: true,
                closeByDocument: true,
                closeByEscape: true
            });

            // https://github.com/chieffancypants/angular-loading-bar
            cfpLoadingBarProvider.loadingBarTemplate = '<div id="loading_bar"><div class="bar"></div></div>';
            cfpLoadingBarProvider.includeSpinner = false;

            // https://angular-translate.github.io/docs/#/api/pascalprecht.translate.$translateProvider
            $translateProvider
                .preferredLanguage(cosConfig.language.default)
                .registerAvailableLanguageKeys(Object.keys(cosConfig.language.list).push(cosConfig.language.debug)) //et
                .determinePreferredLanguage()
                .useSanitizeValueStrategy('escaped') // null, 'escaped' - http://angular-translate.github.io/docs/#/guide/19_security
                .useLocalStorage()
                .useMissingTranslationHandlerLog()
                .translations('dbg', {})
        }]);
})();
