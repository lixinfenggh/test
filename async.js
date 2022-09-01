const { execSync } = require("child_process");
const fs = require('fs');

const lastCommit = fs.readFileSync('./last-commit').toString();

const allGitLogStr = execSync(`git --git-dir my-repo/.git log ${lastCommit ? lastCommit+'..' : ''} --pretty=format:"%H %s" --numstat`).toString();
// console.log(allGitLogStr)
const gitLogs = allGitLogStr.split('\n\n');

let changeTotalLines = 0;
for (let log of gitLogs) {
    const lines = log.split('\n');
    for (let i = 1; i < lines.length; i++) {
        let [addLines, deleteLines] = lines[i].split(/\s/);
        addLines = Number.parseInt(addLines || 1);
        deleteLines = Number.parseInt(deleteLines || 1);
        changeTotalLines += (addLines + deleteLines);
    }
}

// console.log(`---- Today summit ${changeTotalLines} lines ------`)

const morning = (Math.floor(Date.now()/86400000)-1)*86400000 // set to yesterday 8:00 , Asia/Shanghai Timezone
const afternoon =  (Math.floor(Date.now()/86400000)-1)*86400000 + 21600000

for (let log of gitLogs.reverse()) {
    const lines = log.split('\n');
    const [commitId, commitMsg] = lines[0].split(/\s/);
    
    let summitLines = 0;
    for (let i = 1; i < lines.length; i++) {
        let [addLines, deleteLines] = lines[i].split(/\s/);
        addLines = Number.parseInt(addLines || 1);
        deleteLines = Number.parseInt(deleteLines || 1);
        summitLines += (addLines + deleteLines);
    }

    const commitTime = (summitLines / changeTotalLines) < 0.5 ? (morning + (summitLines / changeTotalLines)*28800000) : (afternoon + (summitLines / changeTotalLines - 0.5)*28800000) 

    console.log(`committing ${commitId} ${commitMsg}`);

    execSync(`git --git-dir my-repo/.git checkout ${commitId}`)
    execSync(`rsync -av --exclude='.git' my-repo/ github-repo`)
    execSync(`git --git-dir github-repo/.git add .`)
    execSync(`GIT_COMMITTER_DATE="${new Date(commitTime).toUTCString()}" GIT_AUTHOR_DATE="${new Date(commitTime).toUTCString()}" git --git-dir github-repo/.git commit -m "${commitMsg}"`)
    execSync(`git --git-dir github-repo/.git push origin HEAD:main`)
    fs.writeFileSync('last-commit', commitId)
}