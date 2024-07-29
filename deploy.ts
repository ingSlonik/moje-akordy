import { NodeSSH, SSHExecCommandResponse } from 'node-ssh';

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
    console.log(`\n✓ Found ${filesToCopy.length} files to copy.`);

    for (const file of filesToCopy) {
        const relativePath = relative(path, file);
        const pathTo = resolve(sshPath, relativePath);
        console.log(`    Copying ${file} -> ${pathTo}`);
        // TODO: ssh.putDirectory when not exists
        await ssh.putFile(file, resolve(sshPath, relativePath));
    }
    console.log(`✓ All files are copied.`);

    console.log(`\nInstalling dependencies...`);
    const responseInstall = await sshExec(ssh, "npm install", "Failed to install dependencies.");
    console.log(responseInstall.stdout.split("\n").join("\n    | "));
    console.log(`✓ Dependencies are installed.`);

    console.log(`\nBuilding project...`);
    const responseBuild = await sshExec(ssh, "npm install", "Failed to build project.");
    console.log(responseBuild.stdout.split("\n").join("\n    | "));
    console.log(`✓ Build project.`);

    const responseScreenList = await sshExec(ssh, "screen -list");
    const isScreenRunning = responseScreenList.stdout.includes(screenName);

    if (isScreenRunning) {
        console.log(`\ni Screen ${screenName} is running.`);
        await sshExec(ssh, `screen -S ${screenName} -X quit`, "Screen is not possible to stop.");
        console.log(`✓ Screen ${screenName} is stopped.`);
    } else {
        console.log(`\ni Screen ${screenName} is not running.`);
    }

    await sshExec(ssh, `screen -S ${screenName} -dm npm start`, "Failed to start project.");
    console.log(`\n✓ New version is running.`);

    ssh.dispose();
    console.log(`\n✓ SSH connection is closed.`);

    console.log(`\n\n✓ Successfully deployed.`);
}

async function sshExec(ssh: NodeSSH, command: string, error?: string): Promise<SSHExecCommandResponse> {
    const response = await ssh.execCommand(command, { cwd: sshPath });
    if (response.code !== 0) {
        console.log(`Code: ${response.code}\n${response.stderr.split("\n").join("\n    | ")}`);
        throw new Error(error);
    }

    return response;
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