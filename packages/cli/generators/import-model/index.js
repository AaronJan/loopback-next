// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/cli
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const chalk = require('chalk');
const path = require('path');
const BaseGenerator = require('../../lib/base-generator');
const modelUtils = require('../../lib/model-discoverer');
const debug = require('../../lib/debug')('import-model-generator');
const utils = require('../../lib/utils');

module.exports = class ModelImporter extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.argument('modelFile', {
      type: String,
      required: true,
      description:
        'Path to the model JSON file to import, ' +
        'e.g. "lb3app/common/models/{model-name}.json"',
    });

    this.option('outDir', {
      type: String,
      description: 'Directory where to write the generated source file',
      default: 'src/models',
    });
  }

  async setOptions() {
    this.modelFile = this.args[0];
    this.artifactInfo.outDir = this.options.outDir;
    this.artifactInfo.relPath = path.relative(
      this.destinationPath(),
      this.artifactInfo.outDir,
    );
    return super.setOptions();
  }

  async experimentalStatus() {
    this.log();
    this.log(
      chalk.red(
        '**WARNING WARNING WARNING**\n' +
          'This command is experimental and not feature-complete yet.\n' +
          'Watch the progress at https://github.com/strongloop/loopback-next/issues/2480',
      ),
    );
    this.log();
  }

  /**
   * Ensure CLI is being run in a LoopBack 4 project.
   */
  checkLoopBackProject() {
    if (this.shouldExit()) return;
    return super.checkLoopBackProject();
  }

  async loadModelFile() {
    if (this.shouldExit()) return;
    this.log(`Loading LoopBack 3.x model from ${chalk.yellow(this.modelFile)}`);
    const fullModelPath = path.resolve(this.destinationPath(), this.modelFile);
    this.modelDefinition = this.fs.readJSON(fullModelPath);
  }

  async migrateModel() {
    if (this.shouldExit()) return;
    this.artifactInfo.name = this.modelDefinition.name;
    const result = utils.validateClassName(this.artifactInfo.name);
    if (!result) {
      return this.exit(
        `Cannot import model: the name ${this.artifactInfo.name} is not valid. ${result}`,
      );
    }
    utils.remindAboutNamingRules(this.artifactInfo.name, this.log.bind(this));

    this.templateData = this.modelDefinition;

    Object.entries(this.templateData.properties).forEach(([k, v]) =>
      // FIXME: handle properties with array type, e.g. `{type: [object]}`
      // We need to apply sanitization recursively on nested properties too
      modelUtils.sanitizeProperty(v),
    );

    // FIXME: Handle missing PK property. In LB3, PK is typically defined at runtime by the connector

    /* FIXME: The following base model classes should be recognized and mapped to LB4:
      - Model -> Model
      - PersistedModel -> Entity
      - KeyValueModel -> (to be determined)
    When the base model class is not recognized, the CLI should abort with a descriptive error.
     */
    this.templateData.modelBaseClass = 'Entity';
    this.templateData.isModelBaseBuiltin = true;

    this.templateData.className = utils.pascalCase(this.templateData.name);

    /* FIXME
    The following model settings should trigger a warning when a non-empty value is provided in LB3 model file:
     - relations
     - methods
     - mixins
     - acls

     All other model settings should be copied as-is to LB4 model definition.

     IMPORTANT: settings can be specified either at top-level or inside options
     property, we need to support both flavors.
     Notable settings to test & support:
      - forceId
      - strict
      - connector-specific config like SQL table name and MongoDB collection name
    */

    // FIXME: parse LB3 "strict" setting
    this.templateData.allowAdditionalProperties = true;
    this.templateData.modelSettings = utils.stringifyModelSettings(
      // FIXME: load model settings from top-level entries and `.options` prop
      this.templateData.settings || {},
    );
    debug('LB4 model data', this.templateData);
  }

  /**
   * Iterate through all the models we have discovered and scaffold
   */
  async scaffold() {
    if (this.shouldExit()) return;
    utils.printClassFileName(
      'model',
      'models',
      this.artifactInfo.name,
      this.log.bind(this),
    );

    const fullTargetPath = path.resolve(
      this.artifactInfo.relPath,
      utils.getModelFileName(this.artifactInfo.name),
    );
    debug('Output file', fullTargetPath);

    this.copyTemplatedFiles(
      modelUtils.MODEL_TEMPLATE_PATH,
      fullTargetPath,
      this.templateData,
    );
  }

  async end() {
    if (this.shouldExit() || !this._wasGenerationSuccessful()) {
      await super.end();
      return;
    }

    await this._updateIndexFile(
      this.artifactInfo.outDir,
      utils.getModelFileName(this.artifactInfo.name),
    );

    this.log();
    this.log(
      'Model',
      chalk.yellow(this.artifactInfo.name),
      'was created in',
      chalk.yellow(`${this.artifactInfo.relPath}/`),
    );

    await super.end();
  }
};
