
import { FileSystem } from 'spinal-core-connectorjs_type';
import {
  DIGITAL_TWIN_FILE_MODEL_TYPE,
  DIGITAL_TWIN_SET_DEFAULT,
  DIGITAL_TWIN_SET_DEFAULT_DESCRIPTION,
  DIGITAL_TWIN_SET_DEFAULT_CONFIRM,
  DIGITAL_TWIN_SET_DEFAULT_CONFIRM_ARIA,
  DIGITAL_TWIN_DEFAULT_CANCEL_LOG,
  DIGITAL_TWIN_DEFAULT_DONE,
  DIGITAL_TWIN_DEFAULT_ALREADY_SAME
} from './constant';
import './defaultDigitalTwinService';
const spinalEnvDriveCore = require('spinal-env-drive-core');
const angular = require('angular');
angular
  .module('app.services')
  .run([
    '$mdDialog', 'defaultDigitalTwinService', '$mdToast',
    function ($mdDialog, defaultDigitalTwinService, $mdToast) {
      const anyWin = window;
      // create open digital twin in FE top menu
      class SpinalDriveAppFileExplorerSetDefaultDigitalTwin extends
        spinalEnvDriveCore.SpinalDrive_App {
        constructor() {
          super(DIGITAL_TWIN_SET_DEFAULT, DIGITAL_TWIN_SET_DEFAULT,
            38, 'settings_applications', DIGITAL_TWIN_SET_DEFAULT_DESCRIPTION);
          this.order_priority = 0;

          this.confirm = $mdDialog
            .confirm()
            .title(DIGITAL_TWIN_SET_DEFAULT)
            .textContent(DIGITAL_TWIN_SET_DEFAULT_CONFIRM)
            .ariaLabel(DIGITAL_TWIN_SET_DEFAULT_CONFIRM_ARIA)
            .clickOutsideToClose(true)
            .ok("Confirm")
            .cancel("Cancel");
        }
        async action(obj) {
          const fileModel = (FileSystem._objects[obj.file._server_id]);
          try {
            await $mdDialog.show(this.confirm);
            const done = await defaultDigitalTwinService.setDefaultDigitalTwin(fileModel);
            if (done) { $mdToast.simple(DIGITAL_TWIN_DEFAULT_DONE); }
            else { $mdToast.simple(DIGITAL_TWIN_DEFAULT_ALREADY_SAME); }
          } catch (e) {
            console.log(e);
            console.log(DIGITAL_TWIN_DEFAULT_CANCEL_LOG);
          }
        }

        is_shown(f) {
          const modelType = f.file.model_type;
          return (modelType.toLocaleLowerCase() ===
            DIGITAL_TWIN_FILE_MODEL_TYPE.toLocaleLowerCase());
        }
      }
      anyWin.spinalDrive_Env.add_applications(
        'FileExplorer',
        new SpinalDriveAppFileExplorerSetDefaultDigitalTwin(),
      );
    }
  ]);
