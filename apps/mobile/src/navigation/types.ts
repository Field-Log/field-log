import type { RouteProp } from "@react-navigation/native";

export type PocketTrashParamList = {
  AddItem: { item_type: string };
  AddLog: { itemId: string; itemType: string };
  EditItem: { itemId: string };
  ItemDetail: { itemId: string; item_type: string };
  LibraryList: undefined;
};

export type MainTabParamList = {
  Account: undefined;
  Add: undefined;
  Collections: undefined;
  Library: undefined;
  Log: undefined;
  Stats: undefined;
};

export type PocketTrashNavigation = {
  getParent: () =>
    | {
        navigate: (
          routeName: "Library",
          params?: { screen: "LibraryList" },
        ) => void;
      }
    | undefined;
  goBack: () => void;
  navigate: <RouteName extends keyof PocketTrashParamList>(
    routeName: RouteName,
    ...args: PocketTrashParamList[RouteName] extends undefined
      ? [params?: PocketTrashParamList[RouteName]]
      : [params: PocketTrashParamList[RouteName]]
  ) => void;
  setOptions: (options: { title: string }) => void;
};

export type PocketTrashRoute<RouteName extends keyof PocketTrashParamList> =
  RouteProp<PocketTrashParamList, RouteName>;
