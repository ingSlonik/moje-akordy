import { NodeSSH } from 'node-ssh';

import { lstat, readdir } from 'fs/promises';
import { relative, resolve } from 'path';

const host = '80.211.208.69';
const username = 'root';
const password = process.env.SSH_PASSWORD;

const screenName = "moje-akordy";
const sshPath = resolve("/", "root", "moje-akordy");

const path = resolve(process.cwd());
const ignoreFiles = [
    ".git",
    ".next",
    "node_modules"
];

if (password === undefined)
    throw new Error("SSH_PASSWORD environment variable is not defined.");


async function deploy() {
    const ssh = new NodeSSH();

    console.log(`Connecting to ${host}...`);
    await ssh.connect({ host, username, password });
    console.log(`✓ Connected to SSH server.`);

    const filesToCopy = await getFiles(path);
    console.log(`✓ Found ${filesToCopy.length} files to copy.`);

    for (const file of filesToCopy) {
        const relativePath = relative(path, file);
        console.log(`    Copying ${relativePath}`);
        // TODO: ssh.putDirectory
        await ssh.putFile(file, resolve(sshPath, relativePath));
    }
    console.log(`✓ All files are copied.`);

    console.log(`Installing dependencies...`);
    const responseInstall = await ssh.execCommand("npm install", { cwd: sshPath });
    if (responseInstall.code !== 0) throw new Error("Failed to install dependencies.");
    console.log(responseInstall.stdout.split("\n").join("\n    | "));
    console.log(`✓ Dependencies are installed.`);

    console.log(`Building project...`);
    const responseBuild = await ssh.execCommand("npm install", { cwd: sshPath });
    if (responseBuild.code !== 0) throw new Error("Failed to build project.");
    console.log(responseBuild.stdout.split("\n").join("\n    | "));
    console.log(`✓ Build project.`);

    const responseScreenList = await ssh.execCommand("screen -list", { cwd: sshPath });
    const isScreenRunning = responseScreenList.stdout.includes(screenName);

    if (isScreenRunning) {
        console.log(`✓ Screen ${screenName} is running.`);
        const responseScreenStop = await ssh.execCommand("screen -S moje-akordy -X quit", { cwd: sshPath });
        if (responseScreenStop.code !== 0) throw new Error("Screen is not possible to stop.");
        console.log(`✓ Screen ${screenName} is stopped.`);
    } else {
        console.log(`✓ Screen ${screenName} is not running.`);
    }

    const responseStart = await ssh.execCommand("screen -S moje-akordy -dm npm start", { cwd: sshPath });
    if (responseStart.code !== 0) throw new Error("Failed to start project.");
    console.log(`✓ New version is running.`);

    ssh.dispose();
    console.log(`✓ SSH connection is closed.`);

    console.log(`\n\n✓ Successfully deployed.`);
}

async function getFiles(path: string) {
    const paths: string[] = [];
    const files = await readdir(path);

    for (const file of files) {
        if (ignoreFiles.find(f => file.includes(f)))
            continue;

        const filePath = resolve(path, file);
        const stat = await lstat(filePath);

        if (stat.isDirectory()) {
            paths.push(...await getFiles(filePath));
        } else {
            paths.push(filePath)
        }
    }
    return paths;
}

deploy();