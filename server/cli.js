import { Services } from './services.js';

export async function cli(args) {
  const command = args.shift();
  let services;

  switch (command) {
    case 'build':
      return await Services.createServiceFromRepository(...args);

    case 'reboot':
      services = Services.getAllServices();
      for (const service of services) {
        await Services.createServiceFromRepository(service.repository, service.branch);
      }
      break;

    case 'reload':
      services = Services.getAllServices();
      for (const service of services) {
        Services.restartService(service.repository, service.branch);
      }
      break;

    case 'build-local':
      return await Services.buildServiceFromStoredSettings(...args);

    case 'create':
      return await Services.createServiceKey(...args);

    case 'stop':
      return await Services.stopService(...args);

    case 'start':
      return await Services.startService(...args);

    case 'del':
    case 'delete':
      return await Services.deleteService(...args);

    case 'getkey':
      return await Services.getServiceKey(...args);

    case 'list':
    case 'ls':
      const field = args[0];
      services = Services.getAllServices()
        .map(service => ({
          id: service.id,
          type: service.type,
          online: `[ ${service.online ? 'v' : '!'} ]`,
          origin: service.repository + ' ' + service.branch,
          ports: service.ports.join(','),
          domains: service.domains.map(x => `https://${x}`).join(', '),
        }));

      if (field) {
        return services.map(service => service[field]).join('\n');
      }

      return formatList(
        [['Status', 'Id', 'Type', 'Ports', 'Origin', 'Domains'], Array(6).fill('')].concat(
          services.map(_ => [_.online, _.id, _.type, _.ports, _.origin, _.domains])
        )
      );

    default:
      throw new Error('Invalid command!');
  }
}

function formatList(rows) {
  const sizes = {};
  const spaces = (size) => Array(size).fill(' ').join('');
  const rightPad = (string, size) => string.length < size ? string + spaces(size - string.length) : string;

  rows.forEach(row => {
    row.forEach((column, index) => sizes[index] = Math.max(sizes[index] | 0, column.length));
  });

  const formattedList = rows.map(row => row.map((column, index) => rightPad(column, sizes[index])).join(' | '));
  return formattedList.join('\n');
}