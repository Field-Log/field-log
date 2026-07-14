import type { RouteProp } from "@react-navigation/native";

export type FieldLogParamList = {
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

export type FieldLogNavigation = {
  getParent: () =>
    | {
        navigate: (
          routeName: "Library",
          params?: { screen: "LibraryList" },
        ) => void;
      }
    | undefined;
  goBack: () => void;
  navigate: <RouteName extends keyof FieldLogParamList>(
    routeName: RouteName,
    ...args: FieldLogParamList[RouteName] extends undefined
      ? [params?: FieldLogParamList[RouteName]]
      : [params: FieldLogParamList[RouteName]]
  ) => void;
  setOptions: (options: { title: string }) => void;
};

export type FieldLogRoute<RouteName extends keyof FieldLogParamList> =
  RouteProp<FieldLogParamList, RouteName>;
