import store from '@/store'

import Client from '@/models/server/Client'

import ApiRequest from '@/models/api/ApiRequest'

import { Module, VuexModule, Mutation, Action, getModule } from 'vuex-module-decorators'

import CoreModule from '@/store/modules/server-core'
import ChatModule from '@/store/modules/server-chat'
import { get, has } from 'lodash-es'
import Message from '@/models/server/Message'
import { LogCall } from '@/helpers/decorators/log'
import { CheckPermission } from '@/helpers/decorators/check'
import Connection from '@/models/api/Connection'

export interface IAuthPermissions {
  all?: boolean
  registerNewClient?: boolean
  _renameMe?: boolean
}

export interface IAuthModule {
  readonly clients: { [key: string]: Client }
  process (request: ApiRequest): void
}

// interface FindClientData {
//   clientId: string
// }

interface IRenameClientPayload {
  client: Client,
  newName: string
}

@Module({ dynamic: true, store, name: 'auth' })
class AuthModule extends VuexModule implements IAuthModule {
  private _clients: { [key: string]: Client } = {}

  public get clients () {
    return this._clients
  }

  @Mutation
  @LogCall
  public rename (payload: IRenameClientPayload) {
    if (
      payload.client &&
      payload.newName
    ) {
      this._clients[payload.client.connection.label].name = payload.newName
    }
  }

  @Action
  @LogCall
  @CheckPermission
  private _renameMe (request: ApiRequest) {
    if (!has(request, 'data.params.name')) throw new Error('request has no "data.params.newName"')
    if (!(request.caller instanceof Client)) throw new Error('caller is not a Client')
    const oldName = request.caller.name
    this.rename({
      client: request.caller,
      newName: request.data.params.name
    })
    if (CoreModule.server) {
      ChatModule.addMyMessage(
        new Message(
          CoreModule.server,
          `Пользователь переименовал себя ${
            oldName ? 'из "' + oldName + '"' : ''
          } в "${request.data.params.name}"`
        )
      )
    }
  }

  @Mutation
  @LogCall
  private _addClient (client: Client) {
    this._clients[client.connection.label] = client
  }

  @Action
  @LogCall
  public registerNewClient (connection: Connection) {
    if (!CoreModule.server) return
    this._addClient(new Client(connection))
  }

  @Action
  @LogCall
  public getClientByConnection (connection: Connection): Promise<Client | null> {
    return new Promise((resolve, reject) => {
      if (!has(connection, 'label')) reject(Error('label not found in connection'))
      resolve(get(this.clients, connection.label, null))
    })
  }

  @Action
  @LogCall
  public process (request: ApiRequest) {
    switch (request.query) {
      case 'server/auth?renameMe':
        this._renameMe(request)
        break
    }
  }
}

export default getModule(AuthModule)
