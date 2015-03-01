jira = require('jira');
moment = require('moment');

var env = process.env,
    jiraApi = new jira.JiraApi('https', env.jira_host, env.jira_port, env.jira_user, env.jira_password, '2', true),

    customFields = {
        "releaseDate": "customfield_11530"
    },

    assertions = {
        isIssueUpdated: function(e) {
            return e.webhookEvent === "jira:issue_updated";
        },
        isDevIssue: function(e) {
            var issueTypeId = e.issue.fields.issuetype.id;
            return issueTypeId == 1 || //Bug
                   issueTypeId == 4 || //Improvement
                   issueTypeId == 6;   //Story
        },
        /**
         * Returns true if issue status changed from [Open|InProgress] to [Resolved]
         */
        didIssueGetResolved: function(e) {
            /*
                "changelog": {
                    "items": [
                        {
                            "field": "status",
                            "fieldtype": "jira",
                            "from": "1",
                            "fromString": "Open",
                            "to": "5",
                            "toString": "Resolved"
                        },
                    ]
                }
            */
            var changelog = e.changelog,
                statusChange = function(changelog) {
                    var changes = changelog.items;
                    for (var i=changes.length-1; i>=0; i--) {
                        if (changes[i].fieldtype === "jira" && changes[i].field === "status")
                            return changes[i];
                    }
                }(changelog);
                fromStatusId = statusChange.from,
                toStatusId = statusChange.to;

            return toStatusId == 5 && (fromStatusId  == 1 || fromStatusId == 3);
        }
    },


    processors = [
        {
            name: "releaseDateSetter",
            process: function(e) {
                var issue = e.issue,
                    issueUpdateObject,
                    calculateReleaseDate = function(issue) {
                        var resolutionDateStr = issue.fields.resolutiondate,
                            priority = issue.fields.priority,
                            releaseDate,
                            daysBetweenResolutionAndRelease;

                            if (priority.id >= 3) //Major or below
                                daysBetweenResolutionAndRelease = 10;
                            else if (priority.id == 2) //Critical
                                daysBetweenResolutionAndRelease = 7;
                            else if (priority.id == 1) //Blocker
                                daysBetweenResolutionAndRelease = 1;

                            releaseDate = moment(resolutionDateStr).add(daysBetweenResolutionAndRelease, 'days');
                        return releaseDate.format("YYYY-MM-DD");
                    };

                if (!issue.fields[customFields["releaseDate"]] && assertions.didIssueGetResolved(e)) {
                    issueUpdateObject = {
                        fields: {}
                    };
                    issueUpdateObject.fields[customFields["releaseDate"]] = calculateReleaseDate(issue);
                    jiraApi.updateIssue(issue.key, issueUpdateObject, function(error, status) {
                        if (error) {
                            console.log("failed to update issue " + issue.key + " with error " + error);
                        }
                    });

                }
            }

        },
    ],

    processJiraEvent = function(e) {

        if (assertions.isDevIssue(e) && assertions.isIssueUpdated(e)) {
            for (var i = processors.length-1; i>=0; i--) {
                processors[i].process(e);
            }
        }
    };

exports.process = processJiraEvent;