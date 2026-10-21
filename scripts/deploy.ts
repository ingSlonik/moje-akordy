import { NodeSSH, SSHExecCommandResponse } from 'node-ssh';

import { lstat, readdir } from 'fs/promises';
import { relative, resolve } from 'path';

// Fill in your credentials here, or load them from .env or process.env (e.g. GitHub Secrets).
const host = process.env.SSH_HOST;
const username = process.env.SSH_USERNAME;
const password = process.env.SSH_PASSWORD;

// Configuration for your target server
const server = process.env.SERVER_URL;
const pm2AppName = process.env.PM2_APP_NAME;
const sshPath = process.env.SSH_PATH; // Path on the remote VPS

const path = resolve(process.cwd()); // Local project path
const rootIgnore = new Set([
    ".git",
    ".github",
    ".vite",
    ".env",
    "cache",
    "dist",
    "dist-server",
    "storage",
    "node_modules",
    "scripts",
    "tests",
    "easy-db",
    "easy-db-files",
    "easy-db-backup",
    "__workspace",
]);

// Ensure credentials and paths are provided
if (host === undefined) throw new Error("SSH_HOST environment variable is not defined.");
if (username === undefined) throw new Error("SSH_USERNAME environment variable is not defined.");
if (password === undefined) throw new Error("SSH_PASSWORD environment variable is not defined.");
if (sshPath === undefined) throw new Error("SSH_PATH environment variable is not defined.");

deploy();

// --------------------------------- functions ---------------------------------
async function deploy() {
    const ssh = new NodeSSH();

    console.log(`Connecting to ${host}...`);
    await ssh.connect({ host, username, password });
    console.log(`✔ Connected to SSH server.\n`);

    const files = (await getFiles(path)).map(file => {
        const relativePath = relative(path, file);
        const pathTo = resolve(sshPath, relativePath);
        return { file, pathTo, relativePath };
    });
    console.log(`✔ Found ${files.length} files to copy from ${path} to ${sshPath}.`);

    if (files.length < 50) {
        // Copy file by file
        for (const [i, { file, pathTo, relativePath }] of Object.entries(files)) {
            console.log(`    ${parseInt(i) + 1} / ${files.length} Copying ${relativePath}`);
            await ssh.putFile(file, pathTo);
        }
    } else {
        // Copy all files at once
        files.forEach((file) => console.log(`        ${file.relativePath}`));
        console.log(`    Copying ${files.length} files at once...`)
        await ssh.putFiles(files.map(f => ({ local: f.file, remote: f.pathTo })));
    }
    console.log(`✔ All files are copied.\n`);

    console.log(`Installing dependencies...`);
    await sshExec(ssh, "npm install", "Failed to install dependencies.");
    console.log(`✔ Dependencies are installed.\n`);

    const timeServerOff = new Date().getTime();

    // Cleaning the internal vite cache only; 'npm run build' overwrites outputs safely.
    // Running PM2 processes continue serving uninterrupted until reload.
    console.log(`Cleaning cache...`);
    await sshExec(ssh, "rm -rf .vite", "Failed to remove .vite folder.");
    console.log(`✔ Vite cache cleaned.\n`);

    console.log(`Building project...`);
    await sshExec(ssh, "npm run build", "Failed to build project.");
    console.log(`✔ Build project.\n`);

    // PM2 - Main Server
    if (pm2AppName) {
        try {
            await sshExec(ssh, `pm2 reload ${pm2AppName}`);
        } catch (e) {
            console.log(`✘ ${pm2AppName} is not running in PM2!`);
            await sshExec(ssh, `pm2 start npm --name "${pm2AppName}" -- start`, `${pm2AppName} could not be registered in PM2!`);
        }
        await sshExec(ssh, `pm2 list`);
    } else {
        console.log(`i PM2 step is skipped because PM2_APP_NAME is not defined.\n`);
    }

    ssh.dispose();
    console.log(`✔ SSH connection is closed.\n`);

    if (server) {
        if (!await serverCheck(server))
            throw new Error(`Server ${server} is not available!`);
        console.log(`✔ Server ${server} is running.\n`);
    } else {
        console.log(`i Server check is skipped because SERVER_URL is not defined.\n`);
    }

    console.log(`i Server was ${(new Date().getTime() - timeServerOff) / 1000}s off!\n`);

    console.log(`------------------------\n✔ Successfully deployed.`);
}

async function serverCheck(server: string, tries = 3, delay = 1000) {
    console.log(`Checking ${server} ...`);
    const res = await fetch(server).catch(() => ({ status: 500 }));

    if (res.status === 200) {
        console.log(`i Response status: ${res.status}`);
        return true;
    }

    console.log(`✘ Response status: ${res.status}.`);

    if (tries < 1) return false;

    console.log(`i I'm giving it ${tries} more tries to recover, the next try will be in ${delay / 1000} second...`);
    await timeout(delay);
    return await serverCheck(server, tries - 1, delay);
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

async function getFiles(dir: string): Promise<string[]> {
    const paths: string[] = [];
    const files = await readdir(dir);

    for (const file of files) {
        if (file === ".DS_Store" || file === "node_modules" || file === ".git") {
            continue;
        }

        const filePath = resolve(dir, file);
        const relativeFromRoot = relative(path, filePath);
        const topLevel = relativeFromRoot.split(/[/\\]/)[0];

        if (rootIgnore.has(topLevel)) {
            continue;
        }

        const stat = await lstat(filePath);

        if (stat.isDirectory()) {
            paths.push(...await getFiles(filePath));
        } else {
            paths.push(filePath);
        }
    }
    return paths;
}

async function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
