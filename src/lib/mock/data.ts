/**
 * Mock data for the Whyit application.
 *
 * This file is the ONLY place mock business data should live.
 * Components and pages import from here — never inline mock data in JSX.
 *
 * When real persistence is added:
 * 1. Replace these exports with async fetch functions returning the same shapes
 * 2. No component code needs to change — only these imports
 */

import type { Message, Project } from "@/lib/types";

/** Mock projects for the sidebar. Structured as if returned from an API. */
export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-001",
    name: "Machine Learning Fundamentals",
    workspaceId: "workspace-default",
    goal: "Understand the core concepts of supervised and unsupervised learning",
    motivation: "To transition into an ML engineering role within the next year",
    context: "I have a solid Python background but no formal ML education",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "proj-002",
    name: "Philosophy of Mind",
    workspaceId: "workspace-default",
    goal: "Explore consciousness, perception, and the hard problem",
    motivation: "Personal curiosity — these questions feel foundational to understanding AI",
    context: undefined,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "proj-003",
    name: "Observing Nature",
    workspaceId: "workspace-default",
    goal: "Become a better observer of the natural world",
    motivation: "To slow down and develop a practice of noticing what is actually there",
    context: "No prior experience — starting from zero",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/** Mock messages for a conversation. Structured as if streamed from an AI API. */
export const MOCK_MESSAGES: Message[] = [
  {
    id: "msg-001",
    role: "assistant",
    content:
      "Welcome to your Machine Learning workspace. You mentioned you want to understand supervised and unsupervised learning — let's start with the distinction that matters most.\n\nAt its core, the difference is about whether your training data includes labels. In supervised learning, each example comes with an answer; the model learns to predict that answer. In unsupervised learning, there are no labels — the model finds structure on its own.\n\nWhich side would you like to explore first?",
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-002",
    role: "user",
    content: "Let's start with supervised learning. What are the most important concepts I need to understand?",
    createdAt: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-003",
    role: "assistant",
    content:
      "For supervised learning, the five concepts that everything else builds on:\n\n**1. Training data and labels**\nYou need examples paired with correct answers. The quality and quantity of this data is often more important than the model choice.\n\n**2. Loss functions**\nA loss function measures how wrong the model's predictions are. Training is the process of adjusting the model to reduce this error.\n\n**3. Bias-variance tradeoff**\nModels can be too simple (high bias — underfitting) or too complex (high variance — overfitting). Finding the right complexity is the central challenge.\n\n**4. Generalization**\nA model that memorizes training data is useless. What matters is how it performs on data it hasn't seen.\n\n**5. Evaluation metrics**\nAccuracy, precision, recall, F1 — depending on your problem, different metrics matter. Choosing the wrong one leads to misleading results.\n\nWant to go deep on any of these?",
    createdAt: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
  },
];

/** Simulates a streaming AI response for development validation. */
export const MOCK_STREAMING_RESPONSE =
  "That's a precise question. The bias-variance tradeoff isn't just a theoretical concern — it shapes nearly every practical decision in ML. Here's how to think about it clearly: bias is the error from wrong assumptions in the learning algorithm. A high-bias model pays little attention to training data and oversimplifies the problem. Variance is the error from sensitivity to small fluctuations in the training data. A high-variance model learns the training data too well, including its noise. The goal is to find the sweet spot where the model is complex enough to capture real patterns, but simple enough to generalize. In practice, this means starting simple and increasing complexity only when you have evidence it's needed.";
