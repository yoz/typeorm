import {createConnection} from "../index";
import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {Connection} from "../connection/Connection";
import * as process from "process";
const chalk = require("chalk");


/**
 * Runs migration command.
 */
export class MigrationRunCommand {

    command = "migrations:run";
    describe = "Runs all pending migrations.";

    builder(yargs: any) {
        return yargs
            .option("connection", {
                alias: "c",
                default: "default",
                describe: "Name of the connection on which run a query."
            })
            .option("ignore-timestamp-order", {
                alias: "t",
                boolean: true,
                default: true,
                describe: "Whether to allow migrations to be run not in timestamp order."
            })
            .option("config", {
                alias: "f",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(argv: any) {

        let connection: Connection|undefined = undefined;
        try {
            const connectionOptionsReader = new ConnectionOptionsReader({ root: process.cwd(), configName: argv.config });
            const connectionOptions = await connectionOptionsReader.get(argv.connection);
            Object.assign(connectionOptions, {
                subscribers: [],
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: ["schema"]
            });
            connection = await createConnection(connectionOptions);

            await connection.runMigrations(argv["require-timestamp-order"]);
            await connection.close();

        } catch (err) {
            if (connection) await (connection as Connection).close();

            console.log(chalk.black.bgRed("Error during migration run:"));
            console.error(err);
            process.exit(1);
        }
    }

}
