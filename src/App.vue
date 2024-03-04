<script setup lang="ts">
import { ref, computed } from "vue";
import { useRafFn, useEventListener } from "@vueuse/core";

const items = ref<{ name: string; avatarUrl: string }[]>(
  JSON.parse(localStorage.getItem("items") ?? "[]")
);

const MAX_PIXELS_MOVED_PER_FRAME = 13;
const MIX_PIXELS_MOVED_PER_FRAME = 0;
const INITIAl_PIXELS_MOVED_PER_FRAME = 2;

const SLOW_DOWN_FACTOR = 5;
const INTERVAL_TIME = 100;
const SLOW_DOWN_TIME =
  INTERVAL_TIME * SLOW_DOWN_FACTOR * (1000 / INTERVAL_TIME);

const translateX = ref(0);
const direction = ref<"left" | "right">("left");

const list = ref<HTMLDivElement>();
const pixelsMovedPerFrame = ref(INITIAl_PIXELS_MOVED_PER_FRAME);
const state = ref<"idle" | "moving" | "slowing">("idle");
const result = ref<string | null>(null);

useRafFn(() => {
  const bound = list.value?.clientWidth;

  if (bound) {
    const newTranslateX = translateX.value + pixelsMovedPerFrame.value;

    if (newTranslateX > bound) {
      translateX.value = 0;
    } else {
      translateX.value = newTranslateX;
    }
  }
});

useEventListener("storage", (event) => {
  const { storageArea } = event;

  if (storageArea === localStorage) {
    localStorage.setItem("lastItems", JSON.stringify(items.value, null, 2));
    items.value = JSON.parse(localStorage.getItem("items") ?? "[]");
  }
});

const style = computed(() => {
  const bound = list.value?.clientWidth || 0;
  const newValue =
    direction.value === "left" ? -translateX.value : translateX.value - bound;
  return {
    transform: `translateX(${newValue}px)`,
  };
});
let currentInterval: number | null = null;

const onWheelStop = () => {
  const allItems = Array.from(
    document.querySelectorAll(
      "div[data-candidate]"
    ) as NodeListOf<HTMLDivElement>
  );

  for (const item of allItems) {
    const rect = item.getBoundingClientRect();
    // Check if item is in the middle of visible screen
    if (
      rect.left < window.innerWidth / 2 &&
      rect.right > window.innerWidth / 2
    ) {
      result.value = item.querySelector("img")?.alt ?? "No one";
      alert(`Congratulations! 🥳 ${result.value} 🥳`);
      return;
    }
  }
};

const handleClick = () => {
  if (state.value === "idle") {
    state.value = "moving";
    pixelsMovedPerFrame.value = MAX_PIXELS_MOVED_PER_FRAME;
    return;
  }

  if (state.value === "moving") {
    state.value = "slowing";

    currentInterval = setInterval(() => {
      pixelsMovedPerFrame.value -=
        (INTERVAL_TIME / SLOW_DOWN_TIME) * MAX_PIXELS_MOVED_PER_FRAME;

      if (pixelsMovedPerFrame.value <= 0) {
        state.value = "idle";
        pixelsMovedPerFrame.value = MIX_PIXELS_MOVED_PER_FRAME;
        currentInterval && clearInterval(currentInterval);

        onWheelStop();
      }
    }, INTERVAL_TIME);
  }
};

const buttonTextLookup = {
  idle: "Start",
  moving: "Stop",
  slowing: "Slowing",
};
</script>

<template>
  <div class="m-auto flex flex-col items-center px-4">
    <a
      target="_blank"
      href="https://github.com/willnguyen1312/vue-marquee-wheel"
      class="my-10 text-4xl text-black font-bold"
      >🎡 Marquee Wheel 🎡</a
    >
    <button
      class="text-dark-700 bg-gray-100 decoration-none cursor-pointer rounded-md px-3 py-2 text-sm font-medium"
      :disabled="state === 'slowing'"
      @click="handleClick"
    >
      {{ buttonTextLookup[state] }}
    </button>
    <div class="relative overflow-hidden w-full md:w-8/12">
      <div class="flex will-change-transform" :style="style">
        <div ref="list" class="flex flex-shrink-0 py-4 relative">
          <div
            data-candidate
            v-for="item in items"
            :key="item.name"
            class="h-50 w-50 grid place-items-center border-l-1 border-purple-300 border-l-solid border-r-4"
          >
            <img :alt="item.name" class="border-rd-4" :src="item.avatarUrl" />
          </div>
        </div>

        <!-- Cloned stuff -->
        <div class="flex flex-shrink-0 py-4 relative">
          <div
            data-candidate
            v-for="item in items"
            :key="item.name"
            class="h-50 w-50 grid place-items-center border-l-1 border-purple-300 border-l-solid border-r-4"
          >
            <img :alt="item.name" class="border-rd-4" :src="item.avatarUrl" />
          </div>
        </div>
      </div>

      <div
        class="absolute top-0 bottom-0 z-1 w-0.5 bg-pink-500 left-[50%] translate-x-[50%]"
      ></div>
    </div>
  </div>
</template>
