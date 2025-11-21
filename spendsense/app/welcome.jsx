// app/welcome.jsx
import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Animated,
    Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "./theme";

export default function Welcome() {
    const router = useRouter();
    const { palette } = useTheme();

    const fade = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.95)).current;
    const outFade = useRef(new Animated.Value(1)).current;

    // Fade-in animation
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, {
                toValue: 1,
                duration: 650,
                easing: Easing.out(Easing.exp),
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 1,
                duration: 700,
                easing: Easing.out(Easing.exp),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleStart = () => {
        Animated.timing(outFade, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            router.replace("(tabs)");
        });
    };

    return (
        <Animated.View
            style={[
                styles.container,
                { backgroundColor: palette.BG, opacity: outFade },
            ]}
        >
            {/* ---- Top Bar with Sign In ---- */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    onPress={() => router.push("/auth/login")}
                    style={[styles.signInButton, { borderColor: palette.PRIMARY }]}
                >
                    <Text style={[styles.signInText, { color: palette.PRIMARY }]}>Sign In</Text>
                </TouchableOpacity>

            </View>

            {/* ---- Animated Content ---- */}
            <Animated.View
                style={{
                    opacity: fade,
                    transform: [{ scale }],
                    alignItems: "center",
                }}
            >
                <Image
                    source={{ uri: "https://www.w3schools.com/images/w3lynx_200.webp" }}
                    style={styles.heroImage}
                    resizeMode="contain"
                />

                <Text style={[styles.title, { color: palette.TEXT }]}>
                    Welcome to SpendSense
                </Text>

                <Text style={[styles.subtitle, { color: palette.MUTED }]}>
                    Track your spending, split with friends, stay in control.
                </Text>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: palette.PRIMARY }]}
                    onPress={handleStart}
                >
                    <Text style={styles.buttonText}>Get Started</Text>
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: "center",
        alignItems: "center",
    },

    /* Top-right Sign In */
    topBar: {
        position: "absolute",
        top: 50,
        right: 24,
    },
    signInButton: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderWidth: 1.5,
        borderRadius: 20,
    },
    signInText: {
        fontWeight: "700",
        fontSize: 13,
    },

    heroImage: {
        width: 160,
        height: 160,
        marginBottom: 24,
        borderRadius: 12,
    },
    title: {
        fontSize: 26,
        fontWeight: "800",
        textAlign: "center",
    },
    subtitle: {
        textAlign: "center",
        fontSize: 14,
        marginTop: 10,
        marginBottom: 30,
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 36,
        borderRadius: 30,
        elevation: 4,
    },
    buttonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },
});
