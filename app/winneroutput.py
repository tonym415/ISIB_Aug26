

import random
import numpy as np

class EpsilonGreedy(object):
    def __init__(self,n_arms,epsilon_decay=50):
        self.counts = [0] * n  # example: number of views
        self.values = [0.] * n # example: number of clicks / views
        self.decay = epsilon_decay
        self.n = n_arms

    def choose_arm(self):
        """Choose an arm for testing"""
        epsilon = self.get_epsilon()
        if np.random.random() > epsilon:
            # Exploit (use best arm)
            return np.argmax(self.values)
        else:
            # Explore (test all arms)
            return np.random.randint(self.n)

    def update(self,arm,reward):
        """Update an arm with some reward value""" # Example: click = 1; no click = 0
        self.counts[arm] = self.counts[arm] + 1
        n = self.counts[arm]
        value = self.values[arm]
        # Running product
        new_value = ((n - 1) / float(n)) * value + (1 / float(n)) * reward
        self.values[arm] = new_value

    def get_epsilon(self):
        """Produce epsilon"""
        total = np.sum(arm_counts)
        return float(self.decay) / (total + float(self.decay))
	#test and example of code



random.seed(1)
means = [0.1, 0.1, 0.1, 0.1, 0.9] #this is what we need to update in the sql table after the web scraping script is ran.
n_arms = len(means)
random.shuffle(means)
arms = map(lambda (mu): BernoulliArm(mu), means)
print("Best arm is " + str(ind_max(means)))

f = open("algorithms/epsilon_greedy/standard_results.tsv", "w")

for epsilon in [0.1, 0.2, 0.3, 0.4, 0.5]:
  algo = EpsilonGreedy(epsilon, [], [])
  algo.initialize(n_arms)
  results = test_algorithm(algo, arms, 5000, 250)
  for i in range(len(results[0])):
      f.write(str(epsilon) + "\t")
      f.write("\t".join([str(results[j][i]) for j in range(len(results))]) + "\n")

f.close()
