<script setup lang="ts">
import { ref, computed } from "vue";
import { useRafFn } from "@vueuse/core";

const items: { name: string }[] = JSON.parse(
  localStorage.getItem("items") ?? "[]"
);

const MAX_PIXELS_MOVED_PER_FRAME = 10;
const MIX_PIXELS_MOVED_PER_FRAME = 0;

const SLOW_DOWN_FACTOR = 5;
const INTERVAL_TIME = 100;
const SLOW_DOWN_TIME =
  INTERVAL_TIME * SLOW_DOWN_FACTOR * (1000 / INTERVAL_TIME);

const translateX = ref(0);
const direction = ref<"left" | "right">("left");

const list = ref<HTMLDivElement>();
const pixelsMovedPerFrame = ref(MIX_PIXELS_MOVED_PER_FRAME);
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

const style = computed(() => {
  const bound = list.value?.clientWidth || 0;
  const newValue =
    direction.value === "left" ? -translateX.value : translateX.value - bound;
  return {
    transform: `translateX(${newValue}px)`,
  };
});
let currentInterval: number | null = null;

const getResult = () => {
  const allImages = Array.from(
    document.querySelectorAll(
      "div[data-candidate]"
    ) as NodeListOf<HTMLDivElement>
  );

  for (const image of allImages) {
    const rect = image.getBoundingClientRect();
    // Check image in the middle of the screen
    if (
      rect.left < window.innerWidth / 2 &&
      rect.right > window.innerWidth / 2
    ) {
      result.value = image.textContent;
      console.log("result", result.value);
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

        getResult();
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
    <h1 class="my-10 text-4xl font-bold">🎡 Marquee Wheel 🎡</h1>
    <button
      class="text-dark-700 bg-gray-100 decoration-none cursor-pointer rounded-md px-3 py-2 text-sm font-medium"
      :disabled="state === 'slowing'"
      @click="handleClick"
    >
      {{ buttonTextLookup[state] }}
    </button>
    <div class="relative overflow-hidden w-full md:w-8/12 cursor-pointer">
      <div class="flex will-change-transform" :style="style">
        <div ref="list" class="flex flex-shrink-0 py-4 relative">
          <div
            data-candidate
            v-for="item in items"
            :key="item.name"
            class="h-40 w-40 border-l-1 border-purple-300 border-l-solid"
          >
            {{ item.name }}
          </div>
        </div>

        <!-- Cloned stuff -->
        <div class="flex flex-shrink-0 py-4 relative">
          <div
            data-candidate
            v-for="item in items"
            :key="item.name"
            class="h-40 w-40 border-l-1 border-purple-300 border-l-solid"
          >
            {{ item.name }}
          </div>
        </div>
      </div>

      <div
        class="absolute top-0 bottom-0 z-1 w-0.5 bg-red-500 left-[50%] translate-x-[50%]"
      ></div>
    </div>
  </div>
</template>
