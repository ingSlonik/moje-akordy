import { NodeSSH, SSHExecCommandResponse } from 'node-ssh';

import { lstat, readdir } from 'fs/promises';
import { relative, resolve } from 'path';

const host = process.env.SSH_HOST;
const username = process.env.SSH_USERNAME;
const password = process.env.SSH_PASSWORD;

const server = "https://akordy.paulu.cz/";

const screenName = "moje-akordy";
const sshPath = resolve("/", "root", "moje-akordy");

const path = resolve(process.cwd());
const ignoreFiles = [
  ".git",
  "node_modules",
];

if (host === undefined) throw new Error("SSH_HOST environment variable is not defined.");
if (username === undefined) throw new Error("SSH_USERNAME environment variable is not defined.");
if (password === undefined) throw new Error("SSH_PASSWORD environment variable is not defined.");

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
    files.forEach((file, i) => console.log(`        ${i + 1} / ${files.length} ${file.relativePath}`));
    console.log(`    Copying ${files.length} all files at once...`)
    await ssh.putFiles(files.map(f => ({ local: f.file, remote: f.pathTo })));
  }
  console.log(`✔ All files are copied.\n`);

  console.log(`Installing dependencies...`);
  await sshExec(ssh, "npm install", "Failed to install dependencies.");
  console.log(`✔ Dependencies are installed.\n`);

  console.log(`Removing old build...`);
  await sshExec(ssh, "rm -rf .parcel-cache", "Failed to remove .parcel-cache folder.");
  await sshExec(ssh, "rm -rf dist", "Failed to remove dist folder."); // TODO: keep it for while?
  console.log(`✔ Old build remover.\n`);

  console.log(`Building project...`);
  await sshExec(ssh, "npm run build", "Failed to build project.");
  console.log(`✔ Build project.\n`);

  const responseScreenList = await sshExec(ssh, "screen -list");
  const isScreenRunning = responseScreenList.stdout.includes(screenName);

  if (isScreenRunning) {
    console.log(`i Screen ${screenName} is running.`);
    await sshExec(ssh, `screen -S ${screenName} -X quit`, "Screen is not possible to stop.");
    console.log(`✔ Screen ${screenName} is stopped.\n`);
  } else {
    console.log(`i Screen ${screenName} is not running.\n`);
  }

  const timeServerOff = new Date().getTime();

  await sshExec(ssh, `screen -S ${screenName} -dm npm start`, "Failed to start project.");
  console.log(`✔ New version is running on new screen "${screenName}".\n`);

  ssh.dispose();
  console.log(`✔ SSH connection is closed.\n`);

  if (!await serverCheck(server))
    throw new Error(`Server ${server} is not available!`);
  console.log(`✔ Server ${server} is running.\n`);

  console.log(`i Server was ${(new Date().getTime() - timeServerOff) / 1000}s off!\n`);

  console.log(`------------------------\n✔ Successfully deployed.`);
}

async function serverCheck(server: string, tries = 3, delay = 1000) {
  console.log(`Checking ${server} ...`);
  const res = await fetch(server);

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

async function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
