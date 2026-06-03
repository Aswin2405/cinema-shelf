import React from "react";
import { Tabs } from "expo-router";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { useModal } from "@/context/ModalContext";

const TAB_HEIGHT = 64;
const TAB_MARGIN_H = 18;
const TAB_BOTTOM_GAP = 14;

function GlassBackground({ isDark }: { isDark: boolean }) {
  return (
    <BlurView
      intensity={isDark ? 55 : 78}
      tint={isDark ? "dark" : "light"}
      style={StyleSheet.absoluteFill}
    >
      {/* frosted glass tint */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? "rgba(18, 20, 27, 0.76)"
              : "rgba(255, 252, 248, 0.74)",
          },
        ]}
      />
      {/* top specular highlight — the "liquid" edge */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 24,
          right: 24,
          height: 1,
          borderRadius: 1,
          backgroundColor: isDark
                ? "rgba(255,255,255,0.13)"
                : "rgba(255,255,255,0.9)",
        }}
      />
      {/* inner bottom shadow to give depth */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          borderRadius: 1,
          backgroundColor: isDark
            ? "rgba(0,0,0,0.35)"
            : "rgba(0,0,0,0.06)",
        }}
      />
    </BlurView>
  );
}

function TabIcon({
  name,
  focused,
  color,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  focused: boolean;
  color: string;
}) {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperFocused]}>
      {focused && (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.iconPill,
            {
              backgroundColor: isDark
                ? "rgba(251,113,133,0.22)"
                : "rgba(225,29,72,0.12)",
            },
          ]}
        />
      )}
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

function CenterAddButton() {
  const { openAdd } = useModal();
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={openAdd}
      activeOpacity={0.82}
      style={styles.centerWrapper}
    >
      {/* glow ring */}
      <View
        style={[
          styles.centerGlow,
          { backgroundColor: colors.primary + "30" },
        ]}
      />
      <View style={[styles.centerBtn, { backgroundColor: colors.primary }]}>
        <Ionicons name="add" size={28} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { bottom } = useSafeAreaInsets();

  const tabBarBottom = bottom + TAB_BOTTOM_GAP;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark
          ? "rgba(255,255,255,0.38)"
          : "rgba(0,0,0,0.32)",
        tabBarStyle: {
          position: "absolute",
          bottom: tabBarBottom,
          left: TAB_MARGIN_H,
          right: TAB_MARGIN_H,
          height: TAB_HEIGHT,
          borderRadius: 26,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          // drop shadow giving the pill depth
          ...Platform.select({
            ios: {
              shadowColor: isDark ? "#FB7185" : "#171315",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDark ? 0.24 : 0.14,
              shadowRadius: 20,
            },
            android: { elevation: 16 },
          }),
        },
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: 26, overflow: "hidden" },
            ]}
          >
            <GlassBackground isDark={isDark} />
            {/* thin border ring */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 26,
                  borderWidth: 1,
                  borderColor: isDark
                    ? "rgba(255,255,255,0.09)"
                    : "rgba(255,255,255,0.72)",
                },
              ]}
            />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "home" : "home-outline"}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "search" : "search-outline"}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "",
          tabBarLabel: () => null,
          tabBarButton: () => <CenterAddButton />,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: "Watchlist",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "bookmark" : "bookmark-outline"}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 0,
    letterSpacing: 0.2,
  },
  iconWrapper: {
    width: 44,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  iconWrapperFocused: {},
  iconPill: {
    borderRadius: 12,
  },
  // Center + button
  centerWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerGlow: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E11D48",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
});
