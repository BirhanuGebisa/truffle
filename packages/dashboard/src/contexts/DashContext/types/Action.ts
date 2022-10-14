import type { providers } from "ethers";
import type { ReceivedMessageLifecycle } from "@truffle/dashboard-message-bus-client";
import type { Message } from "@truffle/dashboard-message-bus-common";
import type { State } from "src/contexts/DashContext/types";

export type ActionType =
  | "set-decoder"
  | "set-chain-info"
  | "set-notice"
  | "handle-message";

export interface BaseAction {
  type: ActionType;
}

export interface SetDecoderAction extends BaseAction {
  type: "set-decoder";
  data: State["decoder"];
}

export interface SetChainInfoAction extends BaseAction {
  type: "set-chain-info";
  data: State["chainInfo"];
}

export interface SetNoticeAction extends BaseAction {
  type: "set-notice";
  data: Partial<State["notice"]>;
}

export interface HandleMessageAction extends BaseAction {
  type: "handle-message";
  data: {
    lifecycle: ReceivedMessageLifecycle<Message>;
    provider: providers.Web3Provider;
  };
}

export type Action =
  | SetDecoderAction
  | SetChainInfoAction
  | SetNoticeAction
  | HandleMessageAction;
