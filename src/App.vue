<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import { useRafFn, useEventListener } from "@vueuse/core";
import { decode, encode } from "./utils";

// Check if URL has state query
const urlParams = new URLSearchParams(window.location.search);
const stateQuery = urlParams.get("state") ?? "";
const decodedState = decode(stateQuery) ?? {};

type Person = {
  name: string;
  avatarUrl: string;
};

const initialPeople: Person[] =
  decodedState.people ?? JSON.parse(localStorage.getItem("items") ?? "[]");
const initialIncludedPeople: string[] =
  decodedState.includedPeople ??
  JSON.parse(localStorage.getItem("includedPeople") ?? "[]");

const people = ref<Person[]>(initialPeople);

const includedPeople = ref<string[]>(initialIncludedPeople);

watchEffect(() => {
  localStorage.setItem(
    "includedPeople",
    JSON.stringify(includedPeople.value, null, 2)
  );
  localStorage.setItem("items", JSON.stringify(people.value, null, 2));
});

window.addEventListener("keydown", (e: KeyboardEvent) => {
  // Check if Command or Control key is pressed with s letter
  if ((e.metaKey || e.ctrlKey) && e.key === "s") {
    e.preventDefault();

    // Update URL to include search query in URL
    const decodedState = encode({
      people: people.value,
      includedPeople: includedPeople.value,
    });

    history.replaceState(null, "", `?state=${decodedState}`);
    // Copy url to clipboard
    navigator.clipboard.writeText(window.location.href);
  }
});

const finalPeople = computed(() => {
  return people.value.filter((item) =>
    includedPeople.value.includes(item.name)
  );
});

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
    localStorage.setItem("lastItems", JSON.stringify(people.value, null, 2));
    people.value = JSON.parse(localStorage.getItem("items") ?? "[]");
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
      >🎡 Vue Marquee 🎡</a
    >
    <button
      class="text-dark-700 bg-gray-100 decoration-none cursor-pointer rounded-md px-3 py-2 text-sm font-medium border-cyan-500 border-solid border-2"
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
            v-for="item in finalPeople"
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
            v-for="item in finalPeople"
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

  <fieldset>
    <legend class="text-base text-center font-semibold leading-6 text-gray-900">
      Members
    </legend>
    <div
      class="mt-4 divide-y flex justify-center gap-4 divide-gray-200 border-b border-t border-gray-200"
    >
      <div
        v-for="(person, personIdx) in people"
        :key="personIdx"
        class="relative flex items-start"
      >
        <div class="min-w-0 flex-1 text-sm leading-6">
          <label
            :for="`person-${person.name}`"
            class="select-none font-medium text-gray-900 cursor-pointer"
            >{{ person.name }}</label
          >
        </div>
        <div class="flex h-6 items-center">
          <input
            :id="`person-${person.name}`"
            :name="`person-${person.name}`"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            v-model="includedPeople"
            :value="person.name"
            :disabled="state === 'slowing' || state === 'moving'"
          />
        </div>
      </div>
    </div>
  </fieldset>
</template>
