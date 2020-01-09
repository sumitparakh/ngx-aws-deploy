import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { experimental, normalize } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { Options } from './Options';
import * as glob from 'glob';

export default createBuilder<any>(
  async (builderConfig: Options, context: BuilderContext): Promise<any> => {
    const root = normalize(context.workspaceRoot);
    const workspace = new experimental.workspace.Workspace(root, new NodeJsSyncHost());
    await workspace.loadWorkspaceFromHost(normalize('angular.json')).toPromise();

    if (!context.target) {
      throw new Error('Cannot deploy the application without a target');
    }

    // const project = workspace.getProject(context.target.project);
    // const workspaceRoot = getSystemPath(workspace.root);
    let buildResult: BuilderOutput;
    const configuration = builderConfig.mode ? builderConfig.mode : 'production';

    const build = await context.scheduleTarget({
      target: 'build',
      project: context.target !== undefined ? context.target.project : '',
      configuration
    });

    buildResult = await build.result;


    if (buildResult.success) {
      context.logger.info(`✔ Build Completed`);
      const filesPath = buildResult.outputPath as string;
      const files = await getFiles(filesPath);
      
      if (files.length === 0) {
        throw new Error('Target did not produce any files, or the path is incorrect.');
      }
    } else {
      context.logger.error(`❌ Application build failed`);
      return {
        error: `❌ Application build failed`,
        success: false
      };
    }
    function getFiles(filesPath: string) {
      return glob.sync(`**`, {
        ignore: ['.git'],
        cwd: filesPath,
        nodir: true
      });
    }


  });