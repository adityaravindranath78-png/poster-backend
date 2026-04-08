import {TemplateMeta} from '../types/template';

export type AuthStackParamList = {
  Login: undefined;
  OtpVerify: {phoneNumber: string};
};

export type MainTabParamList = {
  Home: undefined;
  Editor: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  Category: {categoryId: string; categoryLabel: string};
  TemplatePreview: {template: TemplateMeta};
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  Subscription: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  ProfileSetup: undefined;
  Main: undefined;
};
