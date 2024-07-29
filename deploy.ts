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
    console.log(`✓ Connected to SSH server.\n`);

    const filesToCopy = await getFiles(path);
    console.log(`✓ Found ${filesToCopy.length} files to copy from ${path} to ${sshPath}.`);

    for (let i = 0; i < filesToCopy.length; i++) {
        const file = filesToCopy[i];
        const relativePath = relative(path, file);
        const pathTo = resolve(sshPath, relativePath);
        console.log(`    ${i + 1} / ${filesToCopy.length} Copying ${relativePath}`);
        // TODO: ssh.putDirectory when not exists
        await ssh.putFile(file, pathTo);
    }
    console.log(`✓ All files are copied.\n`);

    console.log(`Installing dependencies...`);
    await sshExec(ssh, "npm install", "Failed to install dependencies.");
    console.log(`✓ Dependencies are installed.\n`);

    console.log(`Building project...`);
    await sshExec(ssh, "npm run build", "Failed to build project.");
    console.log(`✓ Build project.\n`);

    const responseScreenList = await sshExec(ssh, "screen -list");
    const isScreenRunning = responseScreenList.stdout.includes(screenName);

    if (isScreenRunning) {
        console.log(`i Screen ${screenName} is running.`);
        await sshExec(ssh, `screen -S ${screenName} -X quit`, "Screen is not possible to stop.");
        console.log(`✓ Screen ${screenName} is stopped.\n`);
    } else {
        console.log(`i Screen ${screenName} is not running.\n`);
    }

    await sshExec(ssh, `screen -S ${screenName} -dm npm start`, "Failed to start project.");
    console.log(`✓ New version is running on new screen "${screenName}".\n`);

    ssh.dispose();
    console.log(`✓ SSH connection is closed.\n`);

    console.log(`------------------------\n✓ Successfully deployed.`);
}

async function sshExec(ssh: NodeSSH, command: string, error?: string): Promise<SSHExecCommandResponse> {
    console.log(`$ ${command}`);
    const response = await ssh.execCommand(command, { cwd: sshPath });
    if (response.code !== 0) {
        console.log(`Code: ${response.code}\n${response.stderr.split("\n").join("\n    | ")}`);
        throw new Error(error);
    }

    console.log(response.stdout.split("\n").join("\n    | "));
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