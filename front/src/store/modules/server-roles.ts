import Permissions, { Permission } from '@/models/server/Permissions'
import User from '@/models/server/User'
import { get } from 'lodash-es'

import store from '@/store/index'
import { Module, VuexModule, Mutation, Action, getModule } from 'vuex-module-decorators'

import ModuleRequest from '@/models/common/ModuleRequest'
import FreeObject from '@/models/common/FreeObject'

interface PermissionToCheck {
  caller: User,
  path: string
}

export interface IRolesModule {
  readonly defaultPermissions: Permission
  readonly permissions: Permissions
  hasPermission (permissionToCheck: PermissionToCheck):boolean
}

export interface IRolesPermissions {
  all?: boolean
}

@Module({ dynamic: true, store, name: 'roles' })
class RolesModule extends VuexModule implements IRolesModule {
  get defaultPermissions (): Permission {
    return {
      all: false,
      auth: {
        all: false,
        rename: {
          own: true,
          other: false
        }
      }
    }
  }

  get permissions (): Permissions {
    return {
      system: {
        all: true
      },
      owner: {
        ...this.defaultPermissions
      },
      client: {
        ...this.defaultPermissions
      }
    }
  }

  @Action
  hasPermission (permissionToCheck: PermissionToCheck):boolean {
    const path = permissionToCheck.path
    const cfg = this.permissions[permissionToCheck.caller.role]

    let pathArr = path.split('.')

    // find full path param
    let _path = pathArr.join('.')
    let result = get(cfg, _path, undefined)
    if (typeof result === 'boolean') return result

    // find "all" param of parrant recursive
    while (pathArr.length > 1) {
      _path = pathArr.join('.') + '.all'
      result = get(cfg, _path, undefined)
      if (typeof result === 'boolean') return result
      pathArr.pop()
    }
    // find "all" param of root
    _path = 'all'
    result = get(cfg, _path, undefined)
    if (typeof result === 'boolean') return result
    return false
  }
  @Action
  process (request: ModuleRequest<FreeObject, FreeObject>) {
    return request
  }
}

export default getModule(RolesModule)
