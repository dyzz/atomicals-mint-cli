import { Worker } from 'worker_threads';
import os from 'os';
import findRoot from 'find-root';
const numCores = os.cpus().length;
const workers = [];
const specialPrefix = '00';

function terminateAllWorkers() {
    workers.forEach(w => {
        if (w && w.terminate) {
            w.terminate().catch(err => console.error(`Error terminating worker: ${err.message}`));
        }
    });
}

function createWorker(workerData: any) {
    const projectRoot = findRoot(__dirname);
    const worker = new Worker(`${projectRoot}/src/miningWorker.js`, { workerData });
    return worker;
}

async function mining(message: string, payloadAt: number, prefix: string, ext: number = -1, numCores: number = 4): Promise<any> {
    return new Promise((resolve, reject) => {
        for (let i = 0; i < numCores; i++) {
            const worker = createWorker({ message, nonceStart: i, payloadAt: payloadAt, nonceStep: numCores, prefix: prefix, ext: ext, id: i });
            workers.push(worker);

            worker.on('message', (message) => {
                if (message.speed) {
                    console.log(`Worker ${message.id} Speed: ${message.speed} hashes/sec`);
                }
                if (message.found) {
                    resolve(message);
                    terminateAllWorkers();
                }
            });

            worker.on('error', reject);
            worker.on('exit', (code) => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            });
        }
    });
}

export {
    mining
}

