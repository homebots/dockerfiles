import { Shell } from './shell.js';
import { Log } from './log.js';
import { join, readDirectory } from './io.js';

const logger = Log.create('docker');
const prefixArgs =  (prefix, args) => args.map(arg => `${prefix} ${arg}`);
const getBuildArgs = (args = []) => prefixArgs('--build-arg', ['CACHEBUSTER=' + new Date().getTime(), ...args]);
const getDockerTag = (service) => 'cloudy/' + service.id;
const getContainerPort = (host, container) => `127.0.0.1:${Number(host)}:${Number(container)}`;
const pathByType = {};
const dataDir = '/opt/data';

class DockerManager {
  constructor() {
    this.init();
  }

  async init() {
    const images = await readDirectory('images');
    this.availableServiceTypes = images;
    this.defaultServiceType = 'node';

    images.forEach(image => pathByType[image] = join('images', image));
  }

  getRunningContainers() {
    return Shell.exec('docker', ['ps', '--format', '"{{.Names}}"']).trim().split('\n');
  }

  startContainer(container) {
    logger.log('start container');
  }

  stopContainer(container) {
    logger.log('stop container');
  }

  createImage(service) {
    try {
      const buildArgs = getBuildArgs(['GIT_URL=' + service.cloneUrl]);
      const folder = pathByType[service.type];

      const imageId = Shell.execAndLog('docker', ['build', '-q', ...buildArgs, '-t', getDockerTag(service), folder]);
      service.imageId = imageId;
    } catch {
      throw new Error('Failed to create image for ' + service.cloneUrl);
    }
  }

  runService(service) {
    const volumes = [
      join('data', service.id) + ':' + dataDir,
    ];

    const ports = service.ports.map(port => getContainerPort(port, port));

    const args = [
      ...prefixArgs('-p', ports),
      ...prefixArgs('-v', volumes),
      '--name', service.id,
    ];

    const env = Object.entries(service.env).concat([
      ['DATA_DIR', dataDir],
    ]);

    env.forEach(variablePair => {
      args.push('-e');
      args.push(`'${variablePair.join('=').replace(/'/g, '')}'`);
    });

    Shell.execAndLog('docker', ['run', '--rm', '-d', ...args, getDockerTag(service)]);
  }

  stopService(service) {
    const runningContainers = this.getRunningContainers();

    if (runningContainers.includes(service.id)) {
      Shell.execAndLog('docker', ['stop', '--time', '2', service.id]);
    }
  }
}

export const Docker = new DockerManager();
