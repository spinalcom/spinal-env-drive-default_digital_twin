
import {
  FileSystem, File, Ptr
} from 'spinal-core-connectorjs_type';
import {
  DIGITAL_TWIN_DEFAULT_DIRECTORY_PATH,
  DIGITAL_TWIN_DEFAULT_FILE_NAME,
  DIGITAL_TWIN_MODEL_TYPE
} from './constant';

import { FileVersionContainerModel } from 'spinal-model-file_version_model';

const angular = require('angular');

angular
  .module('app.services')
  .factory('defaultDigitalTwinService', [
    function () {
      const mapModelDictionary = new Map();

      function loadModelPtr(model) {
        if (model instanceof File) {
          return loadModelPtr(model._ptr);
        }
        if (!(model instanceof Ptr)) {
          throw new Error('loadModelPtr must take Ptr as parameter');
        }
        if (!model.data.value && model.data.model) {
          return Promise.resolve(model.data.model);
        } else if (!model.data.value) {
          throw new Error('Trying to load a Ptr to 0');
        }

        if (mapModelDictionary.has(model.data.value)) {
          return mapModelDictionary.get(model.data.value);
        }
        if (typeof FileSystem._objects[model.data.value] !== 'undefined') {
          const promise = Promise.resolve(FileSystem._objects[model.data.value]);
          mapModelDictionary.set(model.data.value, promise);
          return promise;
        }
        const promise = new Promise((resolve, reject) => {
          model.load(m => {
            if (!m) {
              mapModelDictionary.delete(model.data.value);
              reject(new Error('Error in load Ptr'));
            }
            else {
              resolve(m);
            }
          });
        });
        mapModelDictionary.set(model.data.value, promise);
        return promise;
      }

      function normalisePath(path) {
        // Absolute paths are not allowed
        const lst = path.split("/");
        if (lst[0] === "") {
          lst.splice(0, 1);
        }
        return lst.join("/");
      }

      function getPublicDir() {
        const fs = FileSystem.get_inst();
        const path = normalisePath(DIGITAL_TWIN_DEFAULT_DIRECTORY_PATH);
        return new Promise((resolve, reject) => {
          fs.load_or_make_dir(FileSystem._home_dir + path, (currentDir, err) => {
            if (err) reject();
            else resolve(currentDir);
          });
        });
      }
      function getFileTargetServerId(file) {
        const ptr = file._ptr;
        if (ptr.data.value) return ptr.data.value;
        return ptr.data.model._server_id;
      }

      async function setDefaultDigitalTwin(fileModel) {
        const digitalTwinModel = await loadModelPtr(fileModel);
        const currentDir = await getPublicDir();
        const file = currentDir.detect((x) => x.name.get() === DIGITAL_TWIN_DEFAULT_FILE_NAME);
        if (file) {
          // file exist
          if (getFileTargetServerId(file) === digitalTwinModel._server_id) return false;
          const fvc = await FileVersionContainerModel.getVersionModelFromFile(file);
          fvc.addVersion(digitalTwinModel, DIGITAL_TWIN_DEFAULT_FILE_NAME);
          return true;
        } else {
          // file doesn't exist
          currentDir.add_file(DIGITAL_TWIN_DEFAULT_FILE_NAME, digitalTwinModel, { model_type: DIGITAL_TWIN_MODEL_TYPE });
          const file = currentDir.detect((x) => x.name.get() === DIGITAL_TWIN_DEFAULT_FILE_NAME);
          const fvc = await FileVersionContainerModel.getVersionModelFromFile(file);
          fvc.addVersion(digitalTwinModel, DIGITAL_TWIN_DEFAULT_FILE_NAME);
          return true;
        }
      }

      return {
        loadModelPtr,
        normalisePath,
        getPublicDir,
        getFileTargetServerId,
        setDefaultDigitalTwin
      };
    }]);
