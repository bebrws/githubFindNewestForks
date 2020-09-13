#! /usr/bin/env node
const inquirer = require('inquirer');
const chalk = require('chalk');
const util = require('util');
const { Octokit } = require("@octokit/rest");

async function promptForUsername() {
    var fa = await inquirer.prompt([{
        type: 'input',
        name: 'owner',
        message: "Github Username:"
    }])
    return fa['owner'];
}

async function promptForToken() {
    var fa = await inquirer.prompt([{
        type: 'input',
        name: 'token',
        message: "Enter your Github Personal Access Token with repository rights:"
    }])
    return fa['token'];
}

async function promptForRepoName() {
    var fa = await inquirer.prompt([{
        type: 'input',
        name: 'repo',
        message: "Enter the repository name to find the newest forks of:"
    }])
    return fa['repo'];
}

async function promptForRepoOwner() {
    var fa = await inquirer.prompt([{
        type: 'input',
        name: 'owner',
        message: "Enter the repository's owner to find the newest forks of:"
    }])
    return fa['owner'];
}


function promiseAllIterativeOrFailureObject(promises) {
    return new Promise((resolve, reject) => {
        let results = [];
        let completed = 0;
       
        const handleResult = (result, index) => {
            results[index] = result;
            completed += 1;

            if (completed == promises.length) {
                resolve(results);
            }
        }

        promises.forEach((promise, index) => {
            Promise.resolve(promise).then((r) => handleResult(r, index)).catch((e) => handleResult({fail: true}, index));
        });
    });
}

const sortReposByUpdatedDate = (a, b) => {
    let ad = new Date(a.updated_at);
    let bd = new Date(b.updated_at);
    if (ad > bd) return -1;
    if (ad < bd) return 1;
    return 0;
};


const sortCommitsByComiteerDate = (a, b) => {
    let ad = new Date(a.committer.date);
    let bd = new Date(b.committer.date);
    if (ad > bd) return -1;
    if (ad < bd) return 1;
    return 0;
};

const sortRepoListByCommitDate = (a, b) => {
    let ad = new Date(a.lastCommitDate);
    let bd = new Date(b.lastCommitDate);
    if (ad > bd) return -1;
    if (ad < bd) return 1;
    return 0;
};

async function getMostRecentCommitDateForRepo(octokit, repo) {
    const { data: commits } = await octokit.repos.listCommits({
        owner: repo.owner.login,
        repo: repo.name,
    });
    commits.sort(sortCommitsByComiteerDate);

    return { repo: repo.name, owner: repo.owner.login, lastCommitDate: new Date(commits[0].committer.date) };
}


async function getAllReposWithSameName(octokit, repo) {
    let page = 0;
    let allReposFound = [];
    let repos = [];
    do {
        const { data: { items: repos }} = await octokit.search.repos({q: `${repo} in:name`, per_page: 100})
        allReposFound = allReposFound.concat(repos);
        page += 1;
    } while(repos.length > 0);

    // Only return repos with an exact match on the name
    return allReposFound.filter(r => r.name === repo);
}


async function main() {
    const githubOwner = process.env.GITHUB_USERNAME || await promptForUsername();
    const token = process.env.GITHUB_TOKEN || await promptForToken();
    const repo = process.env.GITHUB_REPO_NAME || await promptForRepoName();
    const owner = process.env.GITHUB_REPO_OWNER || await promptForRepoOwner();
    const octokit = new Octokit({ auth: `token ${token}` });

    let listOwnerRepo = [];

    var { data: baseRepo } = await octokit.repos.get({ owner, repo });
    const baseRepoNewestCommit = await getMostRecentCommitDateForRepo(octokit, baseRepo);

    var { data: forks } = await octokit.repos.listForks({ owner, repo });
    
    forks.sort(sortReposByUpdatedDate);
    const createListOwnerRepoObj = repo => { return { owner: repo.owner.login, repo: repo.name }; };
    listOwnerRepo = listOwnerRepo.concat(forks.map(createListOwnerRepoObj));

    const allReposWithSameName = await getAllReposWithSameName(octokit, repo);
    const allReposWithSameNameExceptBase = allReposWithSameName.filter(r => r.owner != owner);
    
    listOwnerRepo = listOwnerRepo.concat(allReposWithSameNameExceptBase.map(createListOwnerRepoObj));

    const lastCommitForEachRepoPromises = listOwnerRepo.map(r => getMostRecentCommitDateForRepo(octokit, r));
    const lastCommitForEachRepo = await Promise.all(lastCommitForEachRepoPromises);

    lastCommitForEachRepo.sort(sortRepoListByCommitDate);

    console.log("Sorted list of repositories by the last commit date:");
    lastCommitForEachRepo.forEach(r => {
        console.log(`${chalk.blue(r.owner)} / ${chalk.green(r.repo)} - last commit date: ${chalk.red(r.lastCommitDate.toString())}`);
    });
    
}


main().then(() => {})