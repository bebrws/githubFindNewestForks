# Github Find Newest Forks ( And Clones )
Search Github for repo clones and forks. Then sort those repos by the latest commit and output the result. Useful for finding up to date forks of any repo.

It will get the forked repos using Github's api for forks but for cloned repos it will search by repo name then gather those repos with the original repo's name. It then requests the commits for each repo, gets the latest commit from that list and sorts the repos by the latest commits date

It ends by printing out a sorted list ( by repo last commit date ) showing the repo owner and repo name followed by last commit date.

To use just run:
```
npm install -g github-find-newest-forks
gfnfs
```

Env variables can also be set for:
```
GITHUB_USERNAME
GITHUB_TOKEN
GITHUB_REPO_NAME
GITHUB_REPO_OWNER
```

If these are not set a prompt will be shown on the command line.


![Image showing the output of the tool](usage.png)
