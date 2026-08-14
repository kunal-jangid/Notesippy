const { withProjectBuildGradle, withAppBuildGradle, withAndroidManifest, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withNotifee(config) {
  const packageName = config.android?.package || 'com.kunaljangid2k3.notesippy';

  // 1. Add Gradle local Maven path for Notifee
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const mavenRepo = `
        maven {
          url "$rootDir/../node_modules/@notifee/react-native/android/libs"
        }
      `;
      if (!config.modResults.contents.includes('@notifee/react-native/android/libs')) {
        config.modResults.contents = config.modResults.contents.replace(
          /allprojects\s*\{\s*repositories\s*\{/,
          `allprojects {\n    repositories {\n${mavenRepo}`
        );
      }
    }
    return config;
  });

  // 2. Add Foreground Service permissions and Samsung config
  config = withAndroidManifest(config, (config) => {
    const mainManifest = config.modResults.manifest;

    if (!mainManifest['uses-permission']) {
      mainManifest['uses-permission'] = [];
    }

    const permissions = [
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.POST_PROMOTED_NOTIFICATIONS', // Required for Android 15/16 Ongoing Promoted Updates
    ];

    permissions.forEach((perm) => {
      if (!mainManifest['uses-permission'].some((p) => p.$['android:name'] === perm)) {
        mainManifest['uses-permission'].push({
          $: { 'android:name': perm },
        });
      }
    });

    // 3. Inject Samsung Now Bar Ongoing Activity metadata
    const application = mainManifest.application[0];
    if (!application['meta-data']) {
      application['meta-data'] = [];
    }
    const samsungMetaName = 'com.samsung.android.support.ongoing_activity';
    if (!application['meta-data'].some((m) => m.$['android:name'] === samsungMetaName)) {
      application['meta-data'].push({
        $: { 
          'android:name': samsungMetaName,
          'android:value': 'true'
        },
      });
    }

    // 4. Declare the tools namespace on the manifest
    if (!mainManifest.$['xmlns:tools']) {
      mainManifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // 5. Override Notifee service type to 'specialUse' to prevent 3-minute FGS timeout/ANR
    if (!application.service) {
      application.service = [];
    }
    let notifeeService = application.service.find(
      (s) => s.$['android:name'] === 'app.notifee.core.ForegroundService'
    );
    if (!notifeeService) {
      notifeeService = {
        $: {
          'android:name': 'app.notifee.core.ForegroundService',
        },
      };
      application.service.push(notifeeService);
    }
    notifeeService.$['android:foregroundServiceType'] = 'specialUse';
    notifeeService.$['tools:replace'] = 'android:foregroundServiceType';

    // 6. Register custom Samsung Now Bar service in manifest
    const customServiceName = `${packageName}.NowBarService`;
    if (!application.service.some((s) => s.$['android:name'] === customServiceName)) {
      application.service.push({
        $: {
          'android:name': customServiceName,
          'android:foregroundServiceType': 'specialUse',
          'android:exported': 'false',
        },
      });
    }

    return config;
  });

  // 7. Register the native package in MainApplication.kt
  config = withMainApplication(config, (config) => {
    let content = config.modResults.contents;

    // Add import
    const importStr = `import ${packageName}.NowBarPackage`;
    if (!content.includes(importStr)) {
      content = content.replace(
        `package ${packageName}`,
        `package ${packageName}\n\n${importStr}`
      );
    }

    // Add Package to lists
    const packageAddStr = 'add(NowBarPackage())';
    if (!content.includes(packageAddStr)) {
      content = content.replace(
        'PackageList(this).packages.apply {',
        `PackageList(this).packages.apply {\n          add(NowBarPackage())`
      );
    }

    config.modResults.contents = content;
    return config;
  });

  // 8. Generate Java native module files under target package directory
  config = withAndroidManifest(config, (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const packageParts = packageName.split('.');
    const targetDir = path.join(
      projectRoot,
      'android',
      'app',
      'src',
      'main',
      'java',
      ...packageParts
    );

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 8a. Write NowBarService.java
    const serviceCode = `package ${packageName};

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class NowBarService extends Service {
    private static final String CHANNEL_ID = "nowbar_live_channel";
    private static final int NOTIFICATION_ID = 10001;

    private final android.os.Handler mHandler = new android.os.Handler(android.os.Looper.getMainLooper());
    private final Runnable mStopRunnable = new Runnable() {
        @Override
        public void run() {
            stopSelf();
        }
    };

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        double endTimeMillis = intent.getDoubleExtra("endTimeMillis", 0);

        createNotificationChannel();

        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setSmallIcon(getResources().getIdentifier("ic_launcher", "mipmap", getPackageName()))
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setAutoCancel(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setCategory(NotificationCompat.CATEGORY_NAVIGATION);

        if (body != null && !body.trim().isEmpty()) {
            builder.setContentText(body);
        }

        if (endTimeMillis > 0) {
            builder.setUsesChronometer(true);
            long duration = (long) endTimeMillis - System.currentTimeMillis();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                builder.setChronometerCountDown(true);
                builder.setWhen(System.currentTimeMillis() + duration);
            } else {
                builder.setWhen((long) endTimeMillis);
            }

            mHandler.removeCallbacks(mStopRunnable);
            if (duration > 0) {
                mHandler.postDelayed(mStopRunnable, duration);
            } else {
                stopSelf();
                return START_NOT_STICKY;
            }
        }

        // Set the critical promoted ongoing notification flag for Android 15/16 / Samsung Live notifications
        builder.getExtras().putBoolean("android.requestPromotedOngoing", true);

        Notification notification = builder.build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        return START_NOT_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Live Updates",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Shows active note timers on lockscreen and Now Bar");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onDestroy() {
        mHandler.removeCallbacks(mStopRunnable);
        super.onDestroy();
        stopForeground(true);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}`;
    fs.writeFileSync(path.join(targetDir, 'NowBarService.java'), serviceCode);

    // 8b. Write NowBarModule.java
    const moduleCode = `package ${packageName};

import android.content.Intent;
import android.os.Build;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class NowBarModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public NowBarModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "SamsungNowBar";
    }

    @ReactMethod
    public void showLiveNote(String title, String body, double endTimeMillis) {
        Intent serviceIntent = new Intent(reactContext, NowBarService.class);
        serviceIntent.putExtra("title", title);
        serviceIntent.putExtra("body", body);
        serviceIntent.putExtra("endTimeMillis", endTimeMillis);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactContext.startForegroundService(serviceIntent);
        } else {
            reactContext.startService(serviceIntent);
        }
    }

    @ReactMethod
    public void dismissLiveNote() {
        Intent serviceIntent = new Intent(reactContext, NowBarService.class);
        reactContext.stopService(serviceIntent);
    }
}`;
    fs.writeFileSync(path.join(targetDir, 'NowBarModule.java'), moduleCode);

    // 8c. Write NowBarPackage.java
    const packageCode = `package ${packageName};

import androidx.annotation.NonNull;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class NowBarPackage implements ReactPackage {
    @NonNull
    @Override
    public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new NowBarModule(reactContext));
        return modules;
    }

    @NonNull
    @Override
    public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}`;
    fs.writeFileSync(path.join(targetDir, 'NowBarPackage.java'), packageCode);

    return config;
  });

  return config;
};